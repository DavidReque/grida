"use client";

import React, { useState } from "react";
import {
  PreferenceBody,
  PreferenceBox,
  PreferenceBoxFooter,
  PreferenceBoxHeader,
  PreferenceDescription,
} from "@/components/preferences";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { InfoCircledIcon } from "@radix-ui/react-icons";

export function RestrictNumberOfResponseByCustomer({
  form_id,
  init,
}: {
  form_id: string;
  init: {
    is_max_form_responses_by_customer_enabled: boolean;
    max_form_responses_by_customer?: number | null;
  };
}) {
  const [enabled, setEnabled] = useState(
    init.is_max_form_responses_by_customer_enabled
  );
  const [n, setN] = useState(init.max_form_responses_by_customer || 1);

  return (
    <PreferenceBox>
      <PreferenceBoxHeader
        heading={<>Limit number of responses by customer</>}
        description={
          <>
            Make sure you have{" "}
            <Link href={`/d/${form_id}/connect/customer`}>
              <u>customer identity</u>
            </Link>{" "}
            configured or login page enabled.
            <br />
            Otherwise this feature may not work as intended.{" "}
            <HoverCard>
              <HoverCardTrigger>
                <u>
                  <InfoCircledIcon className="inline me-0.5 align-middle" />
                  Lean more
                </u>
              </HoverCardTrigger>
              <HoverCardContent>
                <article className="prose prose-sm dark:prose-invert">
                  Fingerprint generation for some platform/environment may
                  confict customer identity, thus this feature may not work as
                  intended.
                  <br />
                  <br />
                  <strong>Vunarable platforms:</strong>
                  <ul>
                    <li>
                      <a href="https://fingerprint.com/blog/ios15-icloud-private-relay-vulnerability/">
                        iOS 15+ with iCloud Private Relay
                      </a>
                    </li>
                    <li>iOS / Android Webviews</li>
                  </ul>
                  Please note that setting up customer identity or having a
                  login page will resolve this issue.
                </article>
              </HoverCardContent>
            </HoverCard>
            <br />
          </>
        }
      />
      <PreferenceBody>
        <form
          id="/private/editor/settings/max-responses-by-customer"
          action="/private/editor/settings/max-responses-by-customer"
          method="POST"
        >
          <input type="hidden" name="form_id" value={form_id} />
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_max_form_responses_by_customer_enabled"
                name="is_max_form_responses_by_customer_enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label htmlFor="is_max_form_responses_by_customer_enabled">
                {enabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <div className={clsx(!enabled && "hidden")}>
              <Input
                name="max_form_responses_by_customer"
                type="number"
                min={1}
                value={n}
                onChange={(e) => {
                  setN(parseInt(e.target.value));
                }}
              />
            </div>
            {enabled && n ? (
              <PreferenceDescription>
                Limit to {n} {txt_response_plural(n)} per user.
                <>{n === 1 && <> {txt_no_multiple_response_description}</>}</>
              </PreferenceDescription>
            ) : (
              <PreferenceDescription>
                Users can submit an unlimited number of responses.
              </PreferenceDescription>
            )}
          </div>
        </form>
      </PreferenceBody>
      <PreferenceBoxFooter>
        <Button
          form="/private/editor/settings/max-responses-by-customer"
          type="submit"
        >
          Save
        </Button>
      </PreferenceBoxFooter>
    </PreferenceBox>
  );
}

export function MaxRespoonses({
  form_id,
  init,
}: {
  form_id: string;
  init: {
    is_max_form_responses_in_total_enabled: boolean;
    max_form_responses_in_total: number | null;
  };
}) {
  const [enabled, setEnabled] = useState(
    init.is_max_form_responses_in_total_enabled
  );
  const [n, setN] = useState(init.max_form_responses_in_total || 100);

  return (
    <PreferenceBox>
      <PreferenceBoxHeader
        heading={<>Limit number of total responses</>}
        description={
          <>
            Set maximum number of responses allowed. This is useful when you
            have limited number of offers, inventory or tickets.
          </>
        }
      />
      <PreferenceBody>
        <form
          id="/private/editor/settings/max-responses-in-total"
          action="/private/editor/settings/max-responses-in-total"
          method="POST"
        >
          <input type="hidden" name="form_id" value={form_id} />
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_max_form_responses_in_total_enabled"
                name="is_max_form_responses_in_total_enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label htmlFor="is_max_form_responses_in_total_enabled">
                {enabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <div className={clsx(!enabled && "hidden")}>
              <label className="flex flex-col gap-2 cursor-pointer">
                <PreferenceDescription>
                  Maximum number of responses allowed
                </PreferenceDescription>
                <Input
                  name="max_form_responses_in_total"
                  type="number"
                  placeholder="Leave empty for unlimited responses"
                  min={1}
                  value={n}
                  onChange={(e) => {
                    setN(parseInt(e.target.value));
                  }}
                />
              </label>
            </div>
          </div>
        </form>
      </PreferenceBody>
      <PreferenceBoxFooter>
        <Button
          form="/private/editor/settings/max-responses-in-total"
          type="submit"
        >
          Save
        </Button>
      </PreferenceBoxFooter>
    </PreferenceBox>
  );
}

const txt_no_multiple_response_description =
  "Users won't be able to submit multiple responses.";

const txt_response_plural = (n: number) => {
  return n === 1 ? "response" : "responses";
};
