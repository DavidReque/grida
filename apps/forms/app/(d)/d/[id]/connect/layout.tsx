import {
  StripeLogo1,
  StripeLogo2,
  SupabaseLogo,
  TossLogo,
} from "@/components/logos";
import { SideNavBadge, SideNavItem } from "@/components/sidenav";
import {
  ArchiveIcon,
  AvatarIcon,
  CodeIcon,
  EnvelopeClosedIcon,
  Link2Icon,
} from "@radix-ui/react-icons";
import Link from "next/link";

export default function Layout({
  params,
  children,
}: Readonly<{
  children: React.ReactNode;
  params: { id: string };
}>) {
  const id = params.id;

  return (
    <main className="flex flex-1">
      {/* side */}
      <nav className="col-span-1 max-w-xs min-w-60 w-min border-r dark:border-r-neutral-800 h-full">
        <ul className="flex flex-col">
          <li>
            <Link href={`/d/${id}/connect/share`}>
              <SideNavItem>
                <Link2Icon />
                Share
              </SideNavItem>
            </Link>
          </li>
          <li>
            <Link href={`/d/${id}/connect/channels`}>
              <SideNavItem>
                <EnvelopeClosedIcon />
                Channels
              </SideNavItem>
            </Link>
          </li>
          <li>
            <Link href={`/d/${id}/connect/store`}>
              <SideNavItem>
                <ArchiveIcon />
                Store
              </SideNavItem>
            </Link>
          </li>
          <li>
            <Link href={`/d/${id}/connect/customer`}>
              <SideNavItem>
                <AvatarIcon />
                Customer Identity
              </SideNavItem>
            </Link>
          </li>
          <li>
            <Link href={`/d/${id}/connect/database/supabase`}>
              <SideNavItem>
                <SupabaseLogo className="w-4 h-4" />
                Supabase
                <SideNavBadge>alpha</SideNavBadge>
              </SideNavItem>
            </Link>
          </li>
          <li>
            {/* <Link href={`/d/${id}/connect/pg/stripe`}> */}
            <SideNavItem disabled>
              <StripeLogo1 className="w-4 h-4" />
              Stripe
              <SideNavBadge>soon</SideNavBadge>
            </SideNavItem>
            {/* </Link> */}
          </li>
          <li>
            {/* <Link href={`/d/${id}/connect/pg/tosspayments`}> */}
            <SideNavItem disabled>
              <TossLogo className="w-4 h-4" />
              Toss Payments
              <SideNavBadge>soon</SideNavBadge>
            </SideNavItem>
            {/* </Link> */}
          </li>
          <li>
            {/* <Link href={`/d/${id}/connect/parameters`}> */}
            <SideNavItem disabled>
              <CodeIcon />
              URL parameters
              <SideNavBadge>soon</SideNavBadge>
            </SideNavItem>
            {/* </Link> */}
          </li>
          <li>
            {/* <Link href={`/d/${id}/connect/webhooks`}> */}
            <SideNavItem disabled>
              <CodeIcon />
              Webhooks
              <SideNavBadge>soon</SideNavBadge>
            </SideNavItem>
            {/* </Link> */}
          </li>
          <li>
            {/* <Link href={`/d/${id}/connect/integrations`}> */}
            <SideNavItem disabled>
              <CodeIcon />
              Integrations
              <SideNavBadge>soon</SideNavBadge>
            </SideNavItem>
            {/* </Link> */}
          </li>
          <li className="hidden">
            <Link href={`/d/${id}/connect/import`}>
              <SideNavItem>
                <CodeIcon />
                Import Data
                <SideNavBadge>soon</SideNavBadge>
              </SideNavItem>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="w-full h-full overflow-y-scroll p-4 pb-20">
        {children}
      </div>
    </main>
  );
}
