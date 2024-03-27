"use client";

import React, { useEffect, useState } from "react";
import {
  PanelClose,
  PanelContent,
  PanelFooter,
  PanelHeader,
  PanelPropertyField,
  PanelPropertyFields,
  PanelPropertySection,
  PanelPropertySectionTitle,
  PropertyTextInput,
  SidePanel,
} from "@/components/panels/side-panel";
import { FormFieldPreview } from "@/components/formfield";
import {
  FormFieldAutocompleteType,
  FormFieldDataSchema,
  FormFieldType,
  NewFormFieldInit,
  PaymentFieldData,
} from "@/types";
import { capitalCase, snakeCase } from "change-case";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { FormFieldAssistant } from "../ai/form-field-schema-assistant";
import toast from "react-hot-toast";
import { Select } from "@/components/select";
import {
  html5_multiple_supported_field_types,
  supported_field_autocomplete_types,
  supported_field_types,
} from "@/k/supported_field_types";
import {
  payments_service_providers,
  payments_service_providers_display_map,
} from "@/k/payments_service_providers";
import { cls_save_button } from "@/components/preferences";

// @ts-ignore
const default_field_init: {
  [key in FormFieldType]: Partial<NewFormFieldInit>;
} = {
  text: {},
  textarea: { type: "textarea" },
  tel: {
    type: "tel",
    placeholder: "123-456-7890",
    pattern: "[0-9]{3}-[0-9]{3}-[0-9]{4}",
  },
  url: {
    type: "url",
    placeholder: "https://example.com",
    pattern: "https://.*",
  },
  checkbox: { type: "checkbox" },
  number: { type: "number" },
  date: { type: "date" },
  month: { type: "month" },
  week: { type: "week" },
  email: {
    type: "email",
    name: "email",
    label: "Email",
    placeholder: "alice@example.com",
    pattern: "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
  },
  select: {
    type: "select",
    options: [
      { label: "Option 1", value: "option1" },
      { label: "Option 2", value: "option2" },
      { label: "Option 3", value: "option3" },
    ],
  },
  password: { type: "password", placeholder: "Password" },
  color: { type: "color" },
  radio: {
    type: "radio",
    options: [
      { label: "Option 1", value: "option1" },
      { label: "Option 2", value: "option2" },
      { label: "Option 3", value: "option3" },
    ],
  },
  hidden: { type: "hidden" },
  payment: {
    type: "payment",
    data: {
      type: "payment",
    } as PaymentFieldData,
  },
};

const input_can_have_options: FormFieldType[] = ["select", "radio"];
const input_can_have_pattern: FormFieldType[] = supported_field_types.filter(
  (type) => !["checkbox", "color", "radio"].includes(type)
);

export function FieldEditPanel({
  title,
  onSave,
  formResetKey = 0,
  init,
  enableAI,
  mode = "edit",
  ...props
}: React.ComponentProps<typeof SidePanel> & {
  title?: string;
  formResetKey?: number;
  init?: Partial<NewFormFieldInit>;
  mode?: "edit" | "new";
  enableAI?: boolean;
  onSave?: (field: NewFormFieldInit) => void;
}) {
  const [effect_cause, set_effect_cause] = useState<"ai" | "human" | "system">(
    "system"
  );
  const [name, setName] = useState(init?.name || "");
  const [label, setLabel] = useState(init?.label || "");
  const [placeholder, setPlaceholder] = useState(init?.placeholder || "");
  const [helpText, setHelpText] = useState(init?.helpText || "");
  const [type, setType] = useState<FormFieldType>(init?.type || "text");
  const [required, setRequired] = useState(init?.required || false);
  const [pattern, setPattern] = useState<string | undefined>(init?.pattern);
  const [options, setOptions] = useState<
    { label?: string | null; value: string }[]
  >(init?.options || []);
  const [autocomplete, setAutocomplete] = useState<FormFieldAutocompleteType[]>(
    init?.autocomplete || []
  );
  const [data, setData] = useState<FormFieldDataSchema>(init?.data ?? {});
  const [accept, setAccept] = useState<string | undefined>(
    init?.accept ?? undefined
  );
  const [multiple, setMultiple] = useState(init?.multiple || false);

  const preview_label = buildPreviewLabel({
    name,
    label,
    required,
  });

  const has_options = input_can_have_options.includes(type);
  const has_pattern = input_can_have_pattern.includes(type);
  const has_accept = type === "file";

  const preview_placeholder =
    placeholder || convertToPlainText(label) || convertToPlainText(name);

  const preview_disabled =
    !name ||
    (type == "payment" &&
      (data as PaymentFieldData)?.service_provider === "tosspayments");

  const onSaveClick = () => {
    onSave?.({
      name,
      label,
      placeholder,
      helpText,
      type,
      required,
      pattern,
      options,
      autocomplete,
      data,
      accept,
      multiple,
    });
  };

  const onSuggestion = (schema: NewFormFieldInit) => {
    set_effect_cause("ai");

    setName(schema.name);
    setLabel(schema.label);
    setPlaceholder(schema.placeholder);
    setHelpText(schema.helpText);
    setType(schema.type);
    setRequired(schema.required);
    setOptions(schema.options || []);
    setPattern(schema.pattern);
  };

  useEffect(() => {
    if (effect_cause === "human") {
      if (type in default_field_init) {
        const defaults = default_field_init[type];

        // optional reset
        setName((_name) => _name || defaults.name || "");
        setLabel((_label) => _label || defaults.label || "");
        setPlaceholder(
          (_placeholder) => _placeholder || defaults.placeholder || ""
        );
        setHelpText((_help) => _help || defaults.helpText || "");
        setRequired((_required) => _required || defaults.required || false);

        // reset options if there were no existing options
        if (!options?.length) {
          setOptions(defaults.options || []);
        }

        // always reset pattern
        setPattern(defaults.pattern);
      }
    }
  }, [type, effect_cause, options?.length]);

  return (
    <SidePanel {...props}>
      <PanelHeader>{title}</PanelHeader>
      <PanelContent>
        <PanelPropertySection>
          <PanelPropertySectionTitle>Preview</PanelPropertySectionTitle>
          <PanelPropertyFields>
            <div className="relative w-full min-h-40 bg-neutral-200 dark:bg-neutral-800 rounded p-10 border border-black/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Test: Input is valid", {
                    position: "top-right",
                  });
                }}
              >
                <FormFieldPreview
                  name={name}
                  type={type}
                  label={preview_label}
                  labelCapitalize={!!label}
                  placeholder={preview_placeholder}
                  helpText={helpText}
                  required={required}
                  disabled={preview_disabled}
                  options={has_options ? options : undefined}
                  pattern={pattern}
                  autoComplete={autocomplete.join(" ")}
                  data={data}
                  accept={accept}
                  multiple={multiple}
                />
                <div className="absolute bottom-0 right-0 m-2">
                  <button
                    type="submit"
                    className="rounded-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 text-xs font-mono"
                  >
                    Test
                  </button>
                </div>
              </form>
            </div>
          </PanelPropertyFields>
        </PanelPropertySection>
        {enableAI && (
          <PanelPropertySection grid={false}>
            <FormFieldAssistant onSuggestion={onSuggestion} />
          </PanelPropertySection>
        )}
        <form key={formResetKey}>
          <PanelPropertySection>
            <PanelPropertySectionTitle>Field</PanelPropertySectionTitle>
            <PanelPropertyFields>
              <PanelPropertyField label={"Type"}>
                <Select
                  value={type}
                  onChange={(e) => {
                    set_effect_cause("human");
                    setType(e.target.value as FormFieldType);
                  }}
                >
                  {supported_field_types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </PanelPropertyField>
              <PanelPropertyField
                label={
                  <div className="flex gap-2 items-center">
                    <LockClosedIcon />
                    Name *
                  </div>
                }
                description="The input's name, identifier. Recommended to use lowercase and use an underscore to separate words e.g. column_name"
              >
                <PropertyTextInput
                  required
                  autoFocus={mode === "edit"}
                  placeholder={"field_name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </PanelPropertyField>
            </PanelPropertyFields>
          </PanelPropertySection>
          <PanelPropertySection hidden={type !== "payment"}>
            <PanelPropertySectionTitle>Payment</PanelPropertySectionTitle>
            <PanelPropertyFields>
              <PanelPropertyField label={"Service Provider"}>
                <Select
                  value={(data as PaymentFieldData)?.service_provider}
                  onChange={(e) => {
                    setData({
                      ...data,
                      type: "payment",
                      service_provider: e.target.value,
                    });
                  }}
                >
                  {payments_service_providers.map((provider) => (
                    <option key={provider} value={provider}>
                      {payments_service_providers_display_map[provider].label}
                    </option>
                  ))}
                </Select>
              </PanelPropertyField>
            </PanelPropertyFields>
          </PanelPropertySection>
          <PanelPropertySection hidden={type == "payment"}>
            <PanelPropertySectionTitle>General</PanelPropertySectionTitle>
            <PanelPropertyFields>
              <PanelPropertyField
                label={"Label"}
                description="The label that will be displayed to the user"
              >
                <PropertyTextInput
                  placeholder={"Label Text"}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </PanelPropertyField>
              <PanelPropertyField
                label={"Placeholder"}
                description="The placeholder text that will be displayed in the input when it's empty."
              >
                <PropertyTextInput
                  placeholder={"Placeholder Text"}
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                />
              </PanelPropertyField>
              <PanelPropertyField
                label={"Help Text"}
                description="A small hint that will be displayed next to the input to help the user understand what to input."
              >
                <PropertyTextInput
                  placeholder={"Help Text"}
                  value={helpText}
                  onChange={(e) => setHelpText(e.target.value)}
                />
              </PanelPropertyField>
              <PanelPropertyField label={"Auto Complete"}>
                <Select
                  value={autocomplete}
                  onChange={(e) => {
                    setAutocomplete([
                      e.target.value as FormFieldAutocompleteType,
                    ]);
                  }}
                >
                  {supported_field_autocomplete_types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </PanelPropertyField>
              {html5_multiple_supported_field_types.includes(type) && (
                <PanelPropertyField label={"Multiple"}>
                  <input
                    type="checkbox"
                    checked={multiple}
                    onChange={(e) => setMultiple(e.target.checked)}
                  />
                </PanelPropertyField>
              )}
              {type !== "checkbox" && (
                <PanelPropertyField label={"Required"}>
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                  />
                </PanelPropertyField>
              )}
            </PanelPropertyFields>
          </PanelPropertySection>
          <PanelPropertySection hidden={!has_options}>
            <PanelPropertySectionTitle>Options</PanelPropertySectionTitle>
            <PanelPropertyFields>
              {/*  */}
              {options?.map((option, index) => (
                <p key={index}>
                  {option.label} - {option.value}
                </p>
              ))}
            </PanelPropertyFields>
          </PanelPropertySection>
          <PanelPropertySection hidden={type == "payment"}>
            <PanelPropertySectionTitle>Validation</PanelPropertySectionTitle>
            <PanelPropertyFields>
              {has_accept && (
                <PanelPropertyField
                  label={"Accept"}
                  description="A comma-separated list of file types that the input should accept"
                >
                  <PropertyTextInput
                    placeholder={"image/*"}
                    value={accept}
                    onChange={(e) => setAccept(e.target.value)}
                  />
                </PanelPropertyField>
              )}
              {has_pattern && (
                <PanelPropertyField
                  label={"Pattern"}
                  description="A regular expression that the input's value must match"
                >
                  <PropertyTextInput
                    placeholder={".*"}
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                  />
                </PanelPropertyField>
              )}
              {type === "checkbox" && (
                <PanelPropertyField label={"Required"}>
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                  />
                  <p>
                    The checkbox will be required if it is checked. The user
                    must check the checkbox to continue.
                  </p>
                </PanelPropertyField>
              )}
            </PanelPropertyFields>
          </PanelPropertySection>
        </form>
      </PanelContent>
      <PanelFooter>
        <PanelClose>
          <button className="rounded p-2 bg-neutral-100 dark:bg-neutral-900">
            Cancel
          </button>
        </PanelClose>
        <button onClick={onSaveClick} className={cls_save_button}>
          Save
        </button>
      </PanelFooter>
    </SidePanel>
  );
}

function buildPreviewLabel({
  name,
  label,
  required,
}: {
  name: string;
  label?: string;
  required?: boolean;
}) {
  let txt = label || convertToPlainText(name);
  if (required) {
    txt += " *";
  }
  return txt;
}

function convertToPlainText(input: string) {
  // Converts to snake_case then replaces underscores with spaces and capitalizes words
  return capitalCase(snakeCase(input)).toLowerCase();
}
