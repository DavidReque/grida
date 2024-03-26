import Link from "next/link";
import { EditableFormTitle } from "@/scaffolds/editable-form-title";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/server";
import { GridaLogo } from "@/components/grida-logo";
import { EyeOpenIcon, SlashIcon } from "@radix-ui/react-icons";
import { Toaster } from "react-hot-toast";
import { Tabs } from "@/scaffolds/d/tabs";
import { FormEditorProvider } from "@/scaffolds/editor";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { FormPage } from "@/types";
import { PreviewButton } from "@/components/preview-button";
import "../../../editor.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const cookieStore = cookies();
  const supabase = createServerComponentClient(cookieStore);
  const id = params.id;

  const { data, error } = await supabase
    .from("form")
    .select(
      `
        title
      `
    )
    .eq("id", id)
    .single();

  if (!data) {
    return notFound();
  }

  return {
    title: `${data.title} | Grida Forms`,
  };
}

export const revalidate = 0;

export default async function Layout({
  params,
  children,
}: Readonly<{
  children: React.ReactNode;
  params: { id: string };
}>) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient(cookieStore);
  const id = params.id;

  const { data, error } = await supabase
    .from("form")
    .select(
      `
        *,
        fields:form_field(
          *,
          options:form_field_option(*)
        ),
        default_page:form_page!default_form_page_id(
          *,
          blocks:form_block(*)
        )
      `
    )
    .eq("id", id)
    .single();

  if (!data) {
    console.error(id, error);
    return notFound();
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        {process.env.NEXT_PUBLIC_GAID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GAID} />
        )}

        <main className="h-screen flex flex-col">
          <Toaster position="bottom-center" />
          <header className="px-4 flex w-full gap-4 border-b dark:border-neutral-900 bg-white dark:bg-neutral-900 z-10">
            <div className="w-1/3 flex items-center justify-start">
              <Link href="/dashboard">
                <span className="flex items-center gap-2 text-md font-black select-none">
                  <GridaLogo size={15} />
                  Forms
                </span>
              </Link>
              <SlashIcon className="min-w-[20px] ml-2" width={15} height={15} />
              <EditableFormTitle form_id={id} defaultValue={data.title} />
            </div>
            <div className="w-1/3 flex items-center justify-center gap-4">
              <Tabs form_id={id} />
            </div>
            <div className="w-1/3 flex gap-4 items-center justify-end">
              <PreviewButton form_id={id} />
            </div>
          </header>
          <FormEditorProvider
            initial={{
              form_id: id,
              form_title: data.title,
              page_id: data.default_form_page_id,
              fields: data.fields,
              blocks: data.default_page
                ? // there's a bug with supabase typegen, where the default_page will not be a array, but cast it to array.
                  // it's safe to assume as non array.
                  (data.default_page as unknown as FormPage).blocks || []
                : [],
            }}
          >
            <div className="flex flex-1 overflow-y-auto">{children}</div>
          </FormEditorProvider>
        </main>
      </body>
    </html>
  );
}
