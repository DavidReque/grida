import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  grida_forms_client,
  createServerComponentClient,
} from "@/lib/supabase/server";
import { Metadata } from "next";
import { Inconsolata, Inter, Lora } from "next/font/google";
import { FormDocument } from "@/types";
import { ThemeProvider } from "@/components/theme-provider";
import { stringfyThemeVariables } from "@/theme/palettes/utils";
import palettes from "@/theme/palettes";
import { CustomCSS } from "@/theme/customcss";

export const revalidate = 0;

const inter = Inter({ subsets: ["latin"], display: "swap" });
const lora = Lora({ subsets: ["latin"], display: "swap" });
const inconsolata = Inconsolata({ subsets: ["latin"], display: "swap" });

const fonts = {
  inter,
  lora,
  inconsolata,
};

const IS_PRODUTION = process.env.NODE_ENV === "production";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = params.id;

  const { data, error } = await grida_forms_client
    .from("form_document")
    .select(
      `
        name,
        is_powered_by_branding_enabled
      `
    )
    // TODO: change to document id after migration
    .eq("form_id", id)
    .single();

  if (!data) {
    return notFound();
  }

  const { name, is_powered_by_branding_enabled } = data;

  return {
    title: is_powered_by_branding_enabled ? `${name} | Grida Forms` : name,
  };
}

export default async function Layout({
  params,
  children,
}: Readonly<{
  children: React.ReactNode;
  params: { id: string };
}>) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = createServerComponentClient(cookieStore);

  const { data, error } = await grida_forms_client
    .from("form_document")
    .select(
      `
        lang,
        stylesheet
      `
    )
    // TODO: change to document id after migration
    .eq("form_id", id)
    .single();

  if (!data) {
    return notFound();
  }

  const { stylesheet, lang } = data as FormDocument;

  const font =
    fonts[stylesheet?.["font-family"] as keyof typeof fonts] || fonts.inter;

  const customcss = stylesheet?.custom
    ? CustomCSS.vanilla(stylesheet?.custom)
    : undefined;
  const palettecss = stylesheet?.palette
    ? stringfyThemeVariables(palettes[stylesheet.palette] as any)
    : undefined;

  const iscsscustomized = !!customcss;

  const props = {
    [CustomCSS.DATA_CUSTOM_CSS_KEY]: iscsscustomized,
  };

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={font.className} {...props}>
        {iscsscustomized && (
          <style
            id="customcss"
            dangerouslySetInnerHTML={{
              __html: `
              ${customcss}
            `,
            }}
          />
        )}
        <style
          id="custompalette"
          dangerouslySetInnerHTML={{
            __html: `
              ${palettecss}
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
