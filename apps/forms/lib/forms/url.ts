import { FormSubmitErrorCode } from "@/types/private/api";
import * as ERR from "@/k/error";

export function editorlink(
  origin: string,
  form_id: string,
  page:
    | "blocks"
    | "settings"
    | "data"
    | "data/responses"
    | "connect"
    | "connect/store"
    | "connect/store/get-started"
    | "connect/store/products"
) {
  switch (page) {
    case "blocks":
      return `${origin}/d/${form_id}/blocks`;
    case "settings":
      return `${origin}/d/${form_id}/settings`;
    case "data":
      return `${origin}/d/${form_id}/data`;
    case "data/responses":
      return `${origin}/d/${form_id}/data/responses`;
    case "connect":
      return `${origin}/d/${form_id}/connect`;
    case "connect/store":
      return `${origin}/d/${form_id}/connect/store`;
    case "connect/store/get-started":
      return `${origin}/d/${form_id}/connect/store/get-started`;
    case "connect/store/products":
      return `${origin}/d/${form_id}/connect/store/products`;
  }
}

export function formlink(
  host: string,
  form_id: string,
  state?:
    | "complete"
    | "alreadyresponded"
    | "developererror"
    | "badrequest"
    | "formclosed"
    | "formsoldout"
    | "formoptionsoldout",
  params?: { [key: string]: string | number | undefined }
) {
  const q = params ? new URLSearchParams(params as any).toString() : null;
  let url = _form_state_link(host, form_id, state);
  if (q) url += `?${q}`;
  return url;
}

function _form_state_link(
  host: string,
  form_id: string,
  state?:
    | "complete"
    | "alreadyresponded"
    | "developererror"
    | "badrequest"
    | "formclosed"
    | "formsoldout"
    | "formoptionsoldout"
) {
  if (state) return `${host}/d/e/${form_id}/${state}`;
  return `${host}/d/e/${form_id}`;
}

export function formerrorlink(
  host: string,
  code: FormSubmitErrorCode,
  data: {
    form_id: string;
    [key: string]: any;
  }
) {
  const { form_id } = data;

  switch (code) {
    case "MISSING_REQUIRED_HIDDEN_FIELDS": {
      return formlink(host, form_id, "badrequest", {
        error: ERR.MISSING_REQUIRED_HIDDEN_FIELDS.code,
      });
    }
    case "UNKNOWN_FIELDS_NOT_ALLOWED": {
      return formlink(host, form_id, "badrequest", {
        error: ERR.UNKNOWN_FIELDS_NOT_ALLOWED.code,
      });
    }
    case "FORM_FORCE_CLOSED": {
      return formlink(host, form_id, "formclosed", {
        oops: ERR.FORM_CLOSED_WHILE_RESPONDING.code,
      });
    }
    case "FORM_CLOSED_WHILE_RESPONDING": {
      return formlink(host, form_id, "formclosed", {
        oops: ERR.FORM_CLOSED_WHILE_RESPONDING.code,
      });
    }
    case "FORM_RESPONSE_LIMIT_REACHED": {
      return formlink(host, form_id, "formclosed", {
        oops: ERR.FORM_CLOSED_WHILE_RESPONDING.code,
      });
    }
    case "FORM_RESPONSE_LIMIT_BY_CUSTOMER_REACHED": {
      return formlink(host, form_id, "alreadyresponded");
    }
    case "FORM_SCHEDULE_NOT_IN_RANGE": {
      return formlink(host, form_id, "formclosed", {
        oops: ERR.FORM_SCHEDULE_NOT_IN_RANGE.code,
      });
    }
    case "FORM_SOLD_OUT": {
      return formlink(host, form_id, "formsoldout");
    }
    case "FORM_OPTION_UNAVAILABLE": {
      return formlink(host, form_id, "formoptionsoldout");
    }
  }
}
