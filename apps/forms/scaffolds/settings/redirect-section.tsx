"use client";

import React, { useState } from "react";
import { Toggle } from "@/components/toggle";
import {
  PreferenceBody,
  PreferenceBox,
  PreferenceBoxFooter,
  PreferenceBoxHeader,
  cls_input,
} from "@/components/preferences";

export function RedirectPreferences({
  form_id,
  defaultValue,
}: {
  form_id: string;
  defaultValue: string;
}) {
  const [enabled, setEnabled] = useState(!!defaultValue);

  return (
    <PreferenceBox>
      <PreferenceBoxHeader heading={<>Custom Redirect URI</>} />
      <PreferenceBody>
        <form
          id="/private/editor/settings/redirect-uri"
          action="/private/editor/settings/redirect-uri"
          method="POST"
        >
          <input type="hidden" name="form_id" value={form_id} />
          <Toggle
            name="is_redirect_after_response_uri_enabled"
            value={enabled}
            label={enabled ? "Enabled" : "Disabled"}
            onChange={setEnabled}
          />

          <div className="flex flex-col gap-8">
            <label className="flex flex-col gap-2">
              <input
                name="redirect_after_response_uri"
                type="text"
                disabled={!enabled}
                defaultValue={defaultValue}
                placeholder="https://.."
                pattern="https://.*"
                className={cls_input}
              />
              <span>
                Redirect to a custom URL after form submission. Leave empty for
                default behavior.
              </span>
            </label>
          </div>
        </form>
      </PreferenceBody>
      <PreferenceBoxFooter>
        <button form="/private/editor/settings/redirect-uri" type="submit">
          Save
        </button>
      </PreferenceBoxFooter>
    </PreferenceBox>
  );
}
