import { GridaLogo } from "@/components/grida-logo";
import { Pricing } from "@/www/pricing/pricing";
import { GitHubLogoIcon, SlashIcon } from "@radix-ui/react-icons";
import {
  AccountTreeIcon,
  ApiIcon,
  DashBoardCustomizeIcon,
  SmartToyIcon,
  AnalysisIcon,
  VisualStudioIcon,
} from "@/www/icons";
import { plans } from "@/www/data/plans";
import { Header } from "../(site)/header";
import Hero from "./sections/hero";
import Demo from "./sections/demo";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <Hero />
      <Demo />
      <div className="container mx-auto px-4">
        <div className="h-16 sm:h-32 lg:h-64" />
        <section>
          <div>
            <h2 className="text-4xl font-semibold text-center py-20 max-w-lg mx-auto">
              Elevate User Experience with Tailored Interactivity{" "}
            </h2>
          </div>
          <div className="mt-20">
            <div className="columns-1 lg:columns-2 2xl:columns-3 grid-rows-2 space-y-20">
              <FeatureCard
                icon={<SmartToyIcon size={24} />}
                title={"Smart Customer Identity"}
                excerpt={
                  "Optimize user experience with customizable Smart Customer Identity in your forms."
                }
              />
              <FeatureCard
                icon={<AccountTreeIcon size={24} />}
                title={"Connect Customer Identity"}
                excerpt={
                  "Align your forms with your customers' identity, fostering a personalized and trustworthy interaction."
                }
              />
              <FeatureCard
                icon={<VisualStudioIcon size={24} />}
                title={"Visual Editor"}
                excerpt={
                  "Visual Editor allows users to intuitively customize visuals, ensuring their forms match their unique style."
                }
              />
              <FeatureCard
                icon={<AnalysisIcon size={24} />}
                title={"Advanced Analytics"}
                excerpt={
                  "Advanced Analytics provides detailed insights to optimize your form strategy."
                }
              />
              <FeatureCard
                icon={<DashBoardCustomizeIcon size={24} />}
                title={"Custom branding & form"}
                excerpt={
                  "Customize your form pages with branding elements to align seamlessly with your brand identity."
                }
              />
              <FeatureCard
                icon={<ApiIcon size={24} />}
                title={"API access"}
                excerpt={
                  "API access allows for streamlined integration and enhanced form functionality."
                }
              />
            </div>
          </div>
        </section>
        <div className="h-96" />
        <Pricing />
        <section className="mt-72">
          <div className="py-80 flex flex-col items-center gap-7">
            <GridaLogo />
            <h2 className="text-4xl font-semibold text-center max-w-2xl mx-auto">
              Create Effortlessly, Expand Boundlessly
            </h2>
            <Link href="/dashboard/new?plan=free">
              <button
                className="mt-10 px-3 py-2 text-white bg-neutral-800 rounded border border-neutral-800 hover:invert
        transition-all"
              >
                Start your project
              </button>
            </Link>
          </div>
        </section>
        {/* <section>
          <div id="accordion-collapse" data-accordion="collapse">
            <h2 id="accordion-collapse-heading-1">
              <button
                type="button"
                className="flex items-center justify-between w-full p-5 font-sm rtl:text-right rounded-xl dark:focus:ring-gray-800 dark:hover:bg-neutral-800 gap-3"
                data-accordion-target="#accordion-collapse-body-1"
                aria-expanded="true"
                aria-controls="accordion-collapse-body-1"
              >
                <span>What is Grida Forms?</span>
                <svg
                  data-accordion-icon
                  className="w-3 h-3 rotate-180 shrink-0"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5 5 1 1 5"
                  />
                </svg>
              </button>
            </h2>
          </div>
          <div
            id="accordion-collapse-body-1"
            className="hidden"
            aria-labelledby="accordion-collapse-heading-1"
          >
            <div className="p-5 dark:bg-gray-900">
              <p className="mb-2 text-gray-500 dark:text-gray-400">
                Flowbite is an open-source library of interactive components
                built on top of Tailwind CSS including buttons, dropdowns,
                modals, navbars, and more.
              </p>
            </div>
          </div>
        </section> */}
      </div>
      <footer className="mx-auto mt-32 w-full max-w-container px-4 sm:px-6 lg:px-8">
        <div className="border-t border-neutral-400 border-opacity-25 py-10">
          <div className="pt-8 flex flex-col items-center gap-7">
            <GridaLogo />
          </div>
        </div>
        <p className="mt-1 text-center text-sm leading-6 text-current">
          Grida Inc. All rights reserved.
        </p>
        <div className="mt-20 mb-16 flex items-center justify-center text-sm leading-6 text-neutral-500">
          Privacy policy
          <div className="h-4 w-px mx-4 bg-neutral-400 opacity-25"></div>
          <p>Changelog</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  excerpt,
  icon,
}: {
  title: string;
  excerpt: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex justify-center">
      <div className="flex-col gap-7">
        {icon}
        <div className="flex flex-col gap-1 mt-4 max-w-64">
          <span className="text-md font-medium">{title}</span>
          <p className=" text-sm font-normal opacity-50">{excerpt}</p>
        </div>
      </div>
    </div>
  );
}
