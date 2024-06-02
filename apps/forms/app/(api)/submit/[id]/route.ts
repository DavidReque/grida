import {
  SYSTEM_GF_KEY_STARTS_WITH,
  SYSTEM_GF_FINGERPRINT_VISITORID_KEY,
  SYSTEM_GF_CUSTOMER_UUID_KEY,
  SYSTEM_X_GF_GEO_CITY_KEY,
  SYSTEM_X_GF_GEO_COUNTRY_KEY,
  SYSTEM_X_GF_GEO_LATITUDE_KEY,
  SYSTEM_X_GF_GEO_LONGITUDE_KEY,
  SYSTEM_X_GF_GEO_REGION_KEY,
  SYSTEM_X_GF_SIMULATOR_FLAG_KEY,
} from "@/k/system";
import { client, grida_commerce_client } from "@/lib/supabase/server";
import { upsert_customer_with } from "@/services/customer";
import { validate_max_access_by_customer } from "@/services/form/validate-max-access";
import { is_uuid_v4 } from "@/utils/is";
import { NextRequest, NextResponse } from "next/server";
import { formlink } from "@/lib/forms/url";
import * as ERR from "@/k/error";
import {
  FormFieldOptionsInventoryMap,
  form_field_options_inventory,
  validate_options_inventory,
} from "@/services/form/inventory";
import assert from "assert";
import { GridaCommerceClient } from "@/services/commerce";
import { SubmissionHooks } from "./hooks";
import { Features } from "@/lib/features/scheduling";
import { IpInfo, ipinfo } from "@/lib/ipinfo";
import type { Geo, PlatformPoweredBy } from "@/types";
import { PGXXError } from "@/k/errcode";
import { qboolean, qval } from "@/utils/qs";
import { notFound } from "next/navigation";

const HOST = process.env.HOST || "http://localhost:3000";

export const revalidate = 0;

export async function GET(
  req: NextRequest,
  context: {
    params: { id: string };
  }
) {
  const form_id = context.params.id;

  // #region 1 prevalidate request form data (query)
  const __keys = Array.from(req.nextUrl.searchParams.keys());
  const system_gf_keys = __keys.filter((key) =>
    key.startsWith(SYSTEM_GF_KEY_STARTS_WITH)
  );
  const keys = __keys.filter((key) => !system_gf_keys.includes(key));

  if (!keys.length) {
    return NextResponse.json(
      { error: "You must submit form with query params" },
      { status: 400 }
    );
  }
  // #endregion
  const data = req.nextUrl.searchParams as any;
  return submit({
    data: data,
    form_id,
    meta: meta(req, data),
  });
}

export async function POST(
  req: NextRequest,
  context: {
    params: { id: string };
  }
) {
  const form_id = context.params.id;

  // #region 1 prevalidate request form data
  let data: FormData;
  try {
    data = await req.formData();
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "You must submit form with formdata attatched" },
      { status: 400 }
    );
  }
  // #endregion

  return submit({ data, form_id, meta: meta(req, data) });
}

interface SessionMeta {
  accept: "application/json" | "text/html";
  //
  ip: string | null;
  geo?: Geo | null;
  referer: string | null;
  browser: string | null;
  useragent: string | null;
  platform_powered_by: PlatformPoweredBy | null;
}

function meta(req: NextRequest, data?: FormData) {
  // console.log("ip", {
  //   ip: req.ip,
  //   "x-real-ip": req.headers.get("x-real-ip"),
  //   "x-forwarded-for": req.headers.get("x-forwarded-for"),
  // });

  // console.log("geo", req.geo);

  const meta: SessionMeta = {
    accept: haccept(req.headers.get("accept")),
    useragent: req.headers.get("user-agent"),
    ip:
      req.ip ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for"),
    geo: req.geo,
    referer: req.headers.get("referer"),
    browser: req.headers.get("sec-ch-ua"),
    platform_powered_by: "web_client",
  };

  // optionally, developer can override the ip and geo via data body.
  // gf geo
  const __GF_GEO_LATITUDE = req.headers.get(SYSTEM_X_GF_GEO_LATITUDE_KEY);
  const __GF_GEO_LONGITUDE = req.headers.get(SYSTEM_X_GF_GEO_LONGITUDE_KEY);
  const __GF_GEO_REGION = req.headers.get(SYSTEM_X_GF_GEO_REGION_KEY);
  const __GF_GEO_COUNTRY = req.headers.get(SYSTEM_X_GF_GEO_COUNTRY_KEY);
  const __GF_GEO_CITY = req.headers.get(SYSTEM_X_GF_GEO_CITY_KEY);

  if (
    __GF_GEO_LATITUDE ||
    __GF_GEO_LONGITUDE ||
    __GF_GEO_REGION ||
    __GF_GEO_COUNTRY ||
    __GF_GEO_CITY
  ) {
    // all or neither the lat and long should be present
    assert(
      (__GF_GEO_LATITUDE && __GF_GEO_LONGITUDE) ||
        (!__GF_GEO_LATITUDE && !__GF_GEO_LONGITUDE),
      "Both or neither latitude and longitude should be present"
    );

    meta.geo = {
      latitude: __GF_GEO_LATITUDE ? String(__GF_GEO_LATITUDE) : undefined,
      longitude: __GF_GEO_LONGITUDE ? String(__GF_GEO_LONGITUDE) : undefined,
      region: __GF_GEO_REGION ? String(__GF_GEO_REGION) : undefined,
      country: __GF_GEO_COUNTRY ? String(__GF_GEO_COUNTRY) : undefined,
      city: __GF_GEO_CITY ? String(__GF_GEO_CITY) : undefined,
    };
  }

  // gf simulator flag
  const __GF_SIMULATOR_FLAG = req.headers.get(SYSTEM_X_GF_SIMULATOR_FLAG_KEY);
  if (__GF_SIMULATOR_FLAG) {
    if (qboolean(String(__GF_SIMULATOR_FLAG))) {
      meta.platform_powered_by = "simulator";
    }
  }

  return meta;
}

async function submit({
  data,
  form_id,
  meta,
}: {
  form_id: string;
  data: FormData;
  meta: SessionMeta;
}) {
  // console.log("form_id", form_id);

  // check if form exists
  const { data: form_reference } = await client
    .from("form")
    .select(
      `
        *,
        fields:form_field(
          *,
          options:form_field_option(*)
        ),
        store_connection:connection_commerce_store(*)
      `
    )
    .eq("id", form_id)
    .single();

  if (!form_reference) {
    return error(404, { form_id }, meta);
  }

  const {
    project_id,
    unknown_field_handling_strategy,
    is_redirect_after_response_uri_enabled,
    is_ending_page_enabled,
    ending_page_template_id,
    redirect_after_response_uri,
    is_max_form_responses_by_customer_enabled,
    max_form_responses_by_customer,
    is_force_closed,
    store_connection,
    fields,
  } = form_reference;

  const entries = data.entries();

  const __keys_all = Array.from(data.keys());
  const system_gf_keys = __keys_all.filter((key) =>
    key.startsWith(SYSTEM_GF_KEY_STARTS_WITH)
  );
  const nonsystem_keys = __keys_all.filter(
    (key) => !system_gf_keys.includes(key)
  );

  // console.log("submit#meta", meta);

  // pre meta processing
  let ipinfo_data: IpInfo | null = isObjectEmpty(meta.geo)
    ? await fetchipinfo(meta.ip)
    : null;

  // customer handling

  const _gf_customer_uuid: string | null = qval(
    data.get(SYSTEM_GF_CUSTOMER_UUID_KEY) as string
  );

  const _fp_fingerprintjs_visitorid: string | null = data.get(
    SYSTEM_GF_FINGERPRINT_VISITORID_KEY
  ) as string;

  // console.log("/submit::_gf_customer_uuid:", _gf_customer_uuid);

  const customer = await upsert_customer_with({
    project_id: form_reference.project_id,
    uuid: _gf_customer_uuid,
    hints: {
      _fp_fingerprintjs_visitorid,
    },
  });

  // console.log("/submit::customer:", customer);

  // validation - check if form is force closed
  if (is_force_closed) {
    return error(ERR.FORM_CLOSED_WHILE_RESPONDING.code, { form_id }, meta);
  }

  const required_hidden_fields = fields.filter(
    (f) => f.type === "hidden" && f.required
  );

  // validation - check if all value is present for required hidden fields
  const missing_required_hidden_fields = required_hidden_fields.filter((f) => {
    // TODO: to be more clear, rather than checking if the value is present, check if the value matches the required format, e.g. uuidv4 for __gf_customer_uuid
    return !(__keys_all.includes(f.name) && !!data.get(f.name));
  });

  if (missing_required_hidden_fields.length > 0) {
    console.error("error", ERR.MISSING_REQUIRED_HIDDEN_FIELDS);
    return error(
      ERR.MISSING_REQUIRED_HIDDEN_FIELDS.code,
      {
        form_id,
        keys: missing_required_hidden_fields.filter(Boolean).map((f) => f.name),
      },
      meta
    );
  }

  // validation - check if new response is accepted for custoemer
  // note: per form validation is ready with db constraints.
  // TODO: this also needs to be migrated to db constraints
  const max_access_by_customer_error = await validate_max_access_by_customer({
    form_id,
    customer_id: customer?.uid,
    is_max_form_responses_by_customer_enabled,
    max_form_responses_by_customer,
  });

  if (max_access_by_customer_error) {
    return error(max_access_by_customer_error.code, { form_id }, meta);
  }

  // validatopn - check if user selected option is connected to inventory and is available
  let options_inventory: FormFieldOptionsInventoryMap | null = null;
  if (store_connection) {
    const commerce = new GridaCommerceClient(
      grida_commerce_client,
      project_id,
      store_connection.store_id
    );

    options_inventory = await form_field_options_inventory({
      project_id: project_id,
      store_id: store_connection.store_id,
    });
    const inventory_keys = Object.keys(options_inventory);

    // TODO: this may conflict the validation policy since v1/load uses render fields.
    const options = form_reference.fields.map((f) => f.options).flat();

    // TODO: now we only support one inventory option selection per form
    const data_present_option_fields = fields.filter((f) => {
      return f.options.length > 0 && !!data.get(f.name);
    });

    // get the option id that is both present in inventory and form data
    const possible_selection_option_ids = data_present_option_fields
      .map((f) => String(data.get(f!.name)))
      .filter((id) => inventory_keys.includes(id));

    assert(
      possible_selection_option_ids.length <= 1,
      "Multiple inventory options is not supported yet."
    );

    const selection_id =
      possible_selection_option_ids.length == 1
        ? possible_selection_option_ids[0]
        : null;

    console.log("selection_id", selection_id);

    // validate if inventory is present
    const inventory_access_error = await validate_options_inventory({
      inventory: options_inventory,
      options: options,
      selection: selection_id ? { id: selection_id } : undefined,
      config: {
        available_counting_strategy: "sum_positive",
      },
    });
    if (inventory_access_error) {
      console.error(inventory_access_error);
      return error(inventory_access_error.code, { form_id }, meta);
    }

    if (selection_id) {
      // TODO: only supports single inventory option selection
      // update the inventory as selected
      await commerce.upsertInventoryItem({
        sku: selection_id,
        level: {
          diff: -1,
          reason: "order",
        },
      });
    }
  }

  // create new form response
  const { data: response_reference_obj, error: response_insertion_error } =
    await client
      .from("response")
      .insert({
        raw: JSON.stringify(Object.fromEntries(entries)),
        form_id: form_id,
        browser: meta.browser,
        ip: meta.ip,
        customer_id: customer?.uid,
        x_referer: meta.referer,
        x_useragent: meta.useragent,
        x_ipinfo: ipinfo_data as {},
        geo: isObjectEmpty(meta.geo)
          ? ipinfo_data
            ? ipinfogeo(ipinfo_data)
            : undefined
          : (meta.geo as {}),
        platform_powered_by: meta.platform_powered_by,
      })
      .select("id")
      .single();

  if (response_insertion_error) {
    console.error("submit/err", response_insertion_error);

    switch (response_insertion_error.code) {
      // force close
      case PGXXError.XX211: {
        // form is force closed
        return error(ERR.FORM_FORCE_CLOSED.code, { form_id }, meta);
      }
      // max response (per form)
      case PGXXError.XX221: {
        // max response limit reached
        return error(ERR.FORM_RESPONSE_LIMIT_REACHED.code, { form_id }, meta);
      }
      // max response (per customer)
      case PGXXError.XX222: {
        // max response limit reached for this customer
        return error(
          ERR.FORM_RESPONSE_LIMIT_BY_CUSTOMER_REACHED.code,
          { form_id },
          meta
        );
      }
      // scheduling
      case PGXXError.XX230: /* out of range */
      case PGXXError.XX231: /* closed */
      case PGXXError.XX232 /* not open yet */: {
        // form is closed by scheduler
        return error(ERR.FORM_SCHEDULE_NOT_IN_RANGE.code, { form_id }, meta);
      }
      default: {
        // server error
        console.error("submit/err", 500);
        return error(500, { form_id }, meta);
      }
    }
  }

  // get the fields ready

  // group by existing and new fields
  const v_form_fields = fields.slice();
  const known_names = nonsystem_keys.filter((key) => {
    return v_form_fields!.some((field: any) => field.name === key);
  });

  const unknown_names = nonsystem_keys.filter((key) => {
    return !v_form_fields!.some((field: any) => field.name === key);
  });
  const ignored_names: string[] = [];
  const target_names: string[] = [];
  let needs_to_be_created: string[] | null = null;

  // create new fields by preference
  if (
    unknown_field_handling_strategy === "ignore" &&
    unknown_names.length > 0
  ) {
    // ignore new fields
    ignored_names.push(...unknown_names);
    // add only existing fields to mapping
    target_names.push(...known_names);
  } else {
    // add all fields to mapping
    target_names.push(...known_names);
    target_names.push(...unknown_names);

    if (unknown_field_handling_strategy === "accept") {
      needs_to_be_created = [...unknown_names];
    } else if (unknown_field_handling_strategy === "reject") {
      if (unknown_names.length > 0) {
        // reject all fields
        return error(
          ERR.UNKNOWN_FIELDS_NOT_ALLOWED.code,
          {
            form_id,
            keys: unknown_names,
          },
          meta
        );
      }
    }
  }

  if (needs_to_be_created) {
    // create new fields
    const { data: new_fields } = await client
      .from("form_field")
      .insert(
        needs_to_be_created.map((key) => ({
          form_id: form_id,
          name: key,
          type: "text" as const,
          description: "Automatically created",
        }))
      )
      .select("*");

    // extend form_fields with new fields (match the type)
    v_form_fields!.push(...new_fields?.map((f) => ({ ...f, options: [] }))!);
  }

  // save each field value
  const { error: v_fields_error } = await client.from("response_field").insert(
    v_form_fields!.map((field) => {
      const { name, options } = field;

      // the field's value can be a input value or a reference to form_field_option
      const value_or_reference = data.get(name);

      // check if the value is a reference to form_field_option
      const is_value_fkey_and_found =
        is_uuid_v4(value_or_reference as string) &&
        options?.find((o: any) => o.id === value_or_reference);

      // locate the value
      const value = is_value_fkey_and_found
        ? is_value_fkey_and_found.value
        : value_or_reference;

      return {
        type: field.type,
        response_id: response_reference_obj!.id,
        form_field_id: field.id,
        form_id: form_id,
        value: JSON.stringify(value),
        form_field_option_id: is_value_fkey_and_found
          ? is_value_fkey_and_found.id
          : null,
      };
    })
  );

  if (v_fields_error) console.error("submit/err/fields", v_fields_error);

  // ==================================================
  // region complete hooks
  // ==================================================

  // hooks are not ready yet
  // try {
  //   await hooks({ form_id });
  // } catch (e) {
  //   console.error("submit/err/hooks", e);
  // }

  // endregion

  // ==================================================
  // region final response
  // ==================================================

  switch (meta.accept) {
    case "application/json": {
      // ==================================================
      // region response building
      // ==================================================

      // build info
      let info: any = {};

      // if there are new fields
      if (needs_to_be_created?.length) {
        info.new_keys = {
          message:
            "There were new unknown fields in the request and the definitions are created automatically. To disable them, set 'unknown_field_handling_strategy' to 'ignore' or 'reject' in the form settings.",
          data: {
            keys: needs_to_be_created,
            fields: v_form_fields!.filter((field: any) =>
              needs_to_be_created!.includes(field.name)
            ),
          },
        };
      }

      // build warning
      let warning: any = {};

      // if there are ignored fields
      if (ignored_names.length > 0) {
        warning.ignored_keys = {
          message:
            "There were unknown fields in the request. To allow them, set 'unknown_field_handling_strategy' to 'accept' in the form settings.",
          data: { keys: ignored_names },
        };
      }

      // endregion

      // finally fetch the response for pingback
      const { data: response, error: select_response_error } = await client
        .from("response")
        .select(
          `
        *,
        response_field (
          *
        )
      `
        )
        .eq("id", response_reference_obj!.id)
        .single();

      if (select_response_error) console.error(select_response_error);

      return NextResponse.json({
        data: response,
        raw: response?.raw,
        warning: Object.keys(warning).length > 0 ? warning : null,
        info: Object.keys(info).length > 0 ? info : null,
        error: null,
      });
    }
    case "text/html": {
      if (is_ending_page_enabled && ending_page_template_id) {
        return NextResponse.redirect(
          formlink(HOST, form_id, "complete", {
            rid: response_reference_obj.id,
          }),
          {
            status: 301,
          }
        );
      }

      if (
        is_redirect_after_response_uri_enabled &&
        redirect_after_response_uri
      ) {
        return NextResponse.redirect(redirect_after_response_uri, {
          status: 301,
        });
      }

      return NextResponse.redirect(
        formlink(HOST, form_id, "complete", {
          rid: response_reference_obj.id,
        }),
        {
          status: 301,
        }
      );
    }
  }

  // endregion
}

function error(
  code:
    | 404
    | 400
    | 500
    //
    | typeof ERR.MISSING_REQUIRED_HIDDEN_FIELDS.code
    | typeof ERR.UNKNOWN_FIELDS_NOT_ALLOWED.code
    | typeof ERR.FORM_FORCE_CLOSED.code
    | typeof ERR.FORM_CLOSED_WHILE_RESPONDING.code
    | typeof ERR.FORM_RESPONSE_LIMIT_REACHED.code
    | typeof ERR.FORM_RESPONSE_LIMIT_BY_CUSTOMER_REACHED.code
    | typeof ERR.FORM_SOLD_OUT.code
    | typeof ERR.FORM_OPTION_UNAVAILABLE.code
    | typeof ERR.FORM_SCHEDULE_NOT_IN_RANGE.code,

  data: {
    form_id: string;
    [key: string]: any;
  },
  meta: {
    accept: "application/json" | "text/html";
  }
) {
  const { form_id } = data;

  const useredirect = meta.accept === "text/html";

  if (useredirect) {
    switch (code) {
      case 404: {
        return notFound();
      }
      case 400: {
        return NextResponse.redirect(formlink(HOST, form_id, "badrequest"), {
          status: 301,
        });
      }
      case 500: {
        return NextResponse.redirect(formlink(HOST, form_id, "badrequest"), {
          status: 301,
        });
      }
      case "MISSING_REQUIRED_HIDDEN_FIELDS": {
        return NextResponse.redirect(
          formlink(HOST, form_id, "badrequest", {
            error: ERR.MISSING_REQUIRED_HIDDEN_FIELDS.code,
          }),
          {
            status: 301,
          }
        );
      }
      case "UNKNOWN_FIELDS_NOT_ALLOWED": {
        return NextResponse.redirect(
          formlink(HOST, form_id, "badrequest", {
            error: ERR.UNKNOWN_FIELDS_NOT_ALLOWED.code,
          }),
          {
            status: 301,
          }
        );
      }
      case "FORM_FORCE_CLOSED": {
        return NextResponse.redirect(
          formlink(HOST, form_id, "formclosed", {
            oops: ERR.FORM_CLOSED_WHILE_RESPONDING.code,
          }),
          {
            status: 301,
          }
        );
      }
      case "FORM_CLOSED_WHILE_RESPONDING": {
        return NextResponse.redirect(
          formlink(HOST, form_id, "formclosed", {
            oops: ERR.FORM_CLOSED_WHILE_RESPONDING.code,
          }),
          {
            status: 301,
          }
        );
      }
      case "FORM_RESPONSE_LIMIT_REACHED": {
        return NextResponse.redirect(
          formlink(HOST, form_id, "formclosed", {
            oops: ERR.FORM_CLOSED_WHILE_RESPONDING.code,
          }),
          {
            status: 301,
          }
        );
      }
      case "FORM_RESPONSE_LIMIT_BY_CUSTOMER_REACHED": {
        return NextResponse.redirect(
          formlink(HOST, form_id, "alreadyresponded"),
          {
            status: 301,
          }
        );
      }
      case "FORM_SCHEDULE_NOT_IN_RANGE": {
        return NextResponse.redirect(
          formlink(HOST, form_id, "formclosed", {
            oops: ERR.FORM_SCHEDULE_NOT_IN_RANGE.code,
          }),
          {
            status: 301,
          }
        );
      }
      case "FORM_SOLD_OUT": {
        return NextResponse.redirect(formlink(HOST, form_id, "formsoldout"), {
          status: 301,
        });
      }
      case "FORM_OPTION_UNAVAILABLE": {
        return NextResponse.redirect(
          formlink(HOST, form_id, "formoptionsoldout"),
          {
            status: 301,
          }
        );
      }
    }
  } else {
    let data: any = null;
    switch (code) {
      case 404: {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }
      case 400: {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
      }
      case 500: {
        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
        );
      }
      case "MISSING_REQUIRED_HIDDEN_FIELDS":
      case "UNKNOWN_FIELDS_NOT_ALLOWED": {
        return NextResponse.json(
          {
            error: code,
            message: ERR[code].message,
            info: data,
          },
          { status: 400 }
        );
      }
      case "FORM_FORCE_CLOSED":
      case "FORM_CLOSED_WHILE_RESPONDING":
      case "FORM_RESPONSE_LIMIT_REACHED":
      case "FORM_RESPONSE_LIMIT_BY_CUSTOMER_REACHED":
      case "FORM_SCHEDULE_NOT_IN_RANGE":
      case "FORM_SOLD_OUT":
      case "FORM_OPTION_UNAVAILABLE":
      default: {
        return NextResponse.json(
          {
            error: code,
            message: ERR[code].message,
            info: data,
          },
          { status: 403 }
        );
      }
    }
  }

  //
}

async function hooks({ form_id }: { form_id: string }) {
  // FIXME: DEV MODE

  // [emails]

  const business_profile = {
    name: "Grida Forms",
    email: "no-reply@cors.sh",
  };

  await SubmissionHooks.send_email({
    form_id: form_id,
    type: "formcomplete",
    from: {
      name: business_profile.name,
      email: business_profile.email,
    },
    to: "universe@grida.co",
    lang: "en",
  });

  // [sms]

  await SubmissionHooks.send_sms({
    form_id: form_id,
    type: "formcomplete",
    to: "...",
    lang: "en",
  });
}

function isObjectEmpty(obj: object | null | undefined) {
  try {
    // @ts-ignore
    return Object.keys(obj).length === 0;
  } catch (e) {
    return true;
  }
}

function ipinfogeo(ipinfo: IpInfo): Geo | null {
  if (!ipinfo) return null;
  if (ipinfo.loc) {
    const [lat, long] = ipinfo.loc.split(",");
    return {
      city: ipinfo.city,
      country: ipinfo.country,
      region: ipinfo.region,
      latitude: lat,
      longitude: long,
    };
  }

  return {
    city: ipinfo.city,
    country: ipinfo.country,
    region: ipinfo.region,
  };
}

/**
 * parse accept header to determine to response with json or redirect
 *
 * default fallback is json
 */
function haccept(accept?: string | null): "application/json" | "text/html" {
  if (accept) {
    if (accept.includes("application/json")) return "application/json";
    if (accept.includes("text/html")) return "text/html";
  }
  return "application/json";
}

async function fetchipinfo(ip?: string | null) {
  if (!ip) return null;
  try {
    return await ipinfo(ip, process.env.IPINFO_ACCESS_TOKEN);
  } catch (e) {
    console.error(e);
    return null;
  }
}
