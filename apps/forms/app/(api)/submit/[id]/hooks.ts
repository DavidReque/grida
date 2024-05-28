import { Resend } from "resend";
import { EmailTemplate } from "@/theme/templates-email/formcomplete/default";
import { Bird } from "@/lib/bird";
import { toArrayOf } from "@/types/utility";

const resend = new Resend(process.env.RESEND_API_KEY);
const bird = new Bird(
  process.env.BIRD_WORKSPACE_ID as string,
  process.env.BIRD_SMS_CHANNEL_ID as string,
  {
    access_key: process.env.BIRD_API_KEY as string,
  }
);

export namespace SubmissionHooks {
  export async function send_email({
    type,
    form_id,
    from,
    to,
  }: {
    type: "formcomplete";
    form_id: string;
    from:
      | {
          name: string;
          email: string;
        }
      | string;
    to: string | string[];
    lang: string;
  }) {
    const { data, error } = await resend.emails.send({
      from: typeof from === "string" ? from : `${from.name} <${from.email}>`,
      to: Array.isArray(to) ? to : [to],
      subject: type,
      text: undefined as any, // bug
      react: EmailTemplate({ firstName: "John" }),
    });

    console.log(data, error);
    //
  }

  export async function send_sms({
    type,
    form_id,
    to,
  }: {
    type: "formcomplete";
    form_id: string;
    to: string | string[];
    lang: string;
  }) {
    console.log("send_sms", type, form_id, to);
    bird
      .sendsms({
        text: "hey",
        contacts: toArrayOf(to).map((tel) => ({
          identifierKey: "phonenumber",
          identifierValue: tel,
        })),
      })
      .then(console.log)
      .catch(console.error);
  }
}
