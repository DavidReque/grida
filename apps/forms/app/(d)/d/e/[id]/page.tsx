import { Form } from "@/scaffolds/e/form";
import i18next from "i18next";

export const revalidate = 0;

export default function FormPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string };
}) {
  const form_id = params.id;

  return (
    <Form
      form_id={form_id}
      params={searchParams}
      translation={{
        next: i18next.t("next"),
        back: i18next.t("back"),
        submit: i18next.t("submit"),
        pay: i18next.t("pay"),
      }}
    />
  );
}
