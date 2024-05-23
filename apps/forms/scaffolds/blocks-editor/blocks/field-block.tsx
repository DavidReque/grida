"use client";

import React, { useCallback, useState } from "react";
import {
  DotsHorizontalIcon,
  GearIcon,
  InputIcon,
  MixIcon,
  Pencil1Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@editor-ui/dropdown-menu";
import { EditorFlatFormBlock } from "@/scaffolds/editor/state";
import {
  BlockHeader,
  FlatBlockBase,
  useBlockFocus,
  useDeleteBlock,
} from "./base-block";
import { useEditorState } from "@/scaffolds/editor";
import { FormFieldDefinition } from "@/types";
import Link from "next/link";
import FormFieldPreview from "@/components/formfield";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export function FieldBlock({
  id,
  type,
  form_field_id,
  data,
}: EditorFlatFormBlock) {
  const [state, dispatch] = useEditorState();
  const [focused, setFocus] = useBlockFocus(id);

  const form_field: FormFieldDefinition | undefined = state.fields.find(
    (f) => f.id === form_field_id
  );

  const is_hidden_field = form_field?.type === "hidden";

  const { available_field_ids } = state;
  const [advanced, setAdvanced] = useState(false);
  const no_available_fields = available_field_ids.length === 0;

  const can_create_new_field_from_this_block =
    no_available_fields && !form_field;

  const deleteBlock = useDeleteBlock();

  const onFieldChange = useCallback(
    (field_id: string) => {
      dispatch({
        type: "blocks/field/change",
        field_id,
        block_id: id,
      });
    },
    [dispatch, id]
  );

  const onNewFieldClick = useCallback(() => {
    dispatch({
      type: "blocks/field/new",
      block_id: id,
    });
  }, [dispatch, id]);

  const onFieldEditClick = useCallback(() => {
    dispatch({
      type: "editor/field/edit",
      field_id: form_field_id!,
    });
  }, [dispatch, form_field_id]);

  const onLogicEditClick = useCallback(() => {
    dispatch({
      type: "editor/panels/block-edit",
      block_id: id,
      open: true,
    });
  }, [dispatch, id]);

  return (
    <FlatBlockBase
      focused={focused}
      invalid={!form_field}
      onPointerDown={setFocus}
    >
      <BlockHeader>
        <div className="flex flex-row items-center gap-8">
          <span className="flex flex-row gap-2 items-center">
            <InputIcon />
            <Dialog
              open={advanced}
              onOpenChange={(open) => {
                if (!open) {
                  setAdvanced(false);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>Advanced Mode</DialogHeader>
                <DialogDescription>
                  In advanced mode, you can re-use already referenced field.
                  This is useful when there are multiple blocks that should be
                  visible optionally. (Use with caution, only one value will be
                  accepted if there are multiple rendered blocks with the same
                  field)
                </DialogDescription>
                <div>
                  <Select
                    value={form_field_id ?? ""}
                    onValueChange={(value) => {
                      onFieldChange(value);
                    }}
                  >
                    <SelectTrigger id="category" aria-label="Select category">
                      <SelectValue placeholder="Select Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.fields.map((f) => (
                        <SelectItem key={f.id} value={f.id} disabled={false}>
                          {f.name}{" "}
                          {!available_field_ids.includes(f.id) &&
                            "(already used)"}
                          <small className="ms-1 font-mono opacity-50">
                            {f.id}
                          </small>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>Save</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Select
              value={form_field_id ?? ""}
              onValueChange={(value) => {
                if (value === "__gf_new") {
                  onNewFieldClick();
                  return;
                }
                if (value === "__gf_advanced") {
                  setAdvanced(true);
                  return;
                }
                onFieldChange(value);
              }}
            >
              <SelectTrigger id="category" aria-label="Select category">
                <SelectValue placeholder="Select Field" />
              </SelectTrigger>
              <SelectContent>
                {state.fields.map((f) => (
                  <SelectItem
                    key={f.id}
                    value={f.id}
                    disabled={!available_field_ids.includes(f.id)}
                  >
                    {f.name}
                  </SelectItem>
                ))}
                {can_create_new_field_from_this_block && (
                  <SelectItem value="__gf_new">
                    <div className="flex items-center">
                      <PlusIcon className="me-2" />
                      Create New Field
                    </div>
                  </SelectItem>
                )}
                <div>
                  <SelectItem value="__gf_advanced">
                    <div className="flex items-center">
                      <GearIcon className="me-2" />
                      Advanced
                    </div>
                  </SelectItem>
                </div>
              </SelectContent>
            </Select>
          </span>
        </div>
        <div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button>
                <DotsHorizontalIcon />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {form_field_id && (
                <DropdownMenuItem onClick={onFieldEditClick}>
                  <Pencil1Icon />
                  Edit Field Definition
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onLogicEditClick}>
                <MixIcon />
                Logic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteBlock(id)}>
                <TrashIcon />
                Delete Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </BlockHeader>
      <div
        className={clsx(
          "w-full min-h-40 bg-neutral-200 dark:bg-neutral-800 rounded p-10 border border-black/20"
        )}
      >
        {is_hidden_field ? (
          <div>
            <p className="text-xs opacity-50">
              Hidden fields are not displayed in the form.
              <br />
              Configure how this field is populated in the form{" "}
              <Link className="underline" href="./settings">
                settings
              </Link>
              .
            </p>
          </div>
        ) : (
          <FormFieldPreview
            readonly
            preview
            disabled={!!!form_field}
            name={form_field?.name ?? ""}
            label={form_field?.label ?? ""}
            type={form_field?.type ?? "text"}
            required={form_field?.required ?? false}
            requiredAsterisk
            helpText={form_field?.help_text ?? ""}
            placeholder={form_field?.placeholder ?? ""}
            options={form_field?.options}
            data={form_field?.data}
          />
        )}
      </div>
    </FlatBlockBase>
  );
}
