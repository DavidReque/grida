type Pricing = {
  highlight: PricingCategory;
  integrations: PricingCategory;
  storage: PricingCategory;
  support: PricingCategory;
  commingsoon: PricingCategory;
};

export type PricingCategory = {
  title: string;
  features: PricingFeature[];
};

type PricingFeature = {
  title: string;
  tooltips?: {
    main?: string;
    pro?: string;
    team?: string;
    enterprise?: string;
  };
  plans: {
    free: boolean | string | string[];
    pro: boolean | string | string[];
    team: boolean | string | string[];
    enterprise: boolean | string | string[];
  };
  usage_based: boolean;
};

export const pricing: Pricing = {
  storage: {
    title: "Features",
    features: [
      {
        title: "Visual Editor",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Custom branding & form page",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Themes & Custom CSS",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "API access",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "JavaScript SDK",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "React & React Native SDK",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Webhooks",
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Redirect after submit",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Window postMessage interface",
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Export to .csv .xlsx",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Smart Customer Identity",
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: true,
      },
      {
        title: "Connect Customer Identity",
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Limit number of responses",
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Advanced Analytics",
        plans: {
          free: false,
          pro: false,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Remove branding on built-in form page",
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
    ],
  },
  support: {
    title: "Support",
    features: [
      {
        title: "Community Support",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Live chat support",
        plans: {
          free: false,
          pro: false,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
    ],
  },
  highlight: {
    title: "File Response & Storage",
    features: [
      {
        title: "Receive file uploads",
        plans: {
          free: "Up to 4.5MB",
          pro: "Up to 150MB",
          team: "Up to 1GB",
          enterprise: "Unlimited",
        },
        usage_based: false,
      },
      {
        title: "File Storage Included",
        plans: {
          free: "100MB",
          pro: "30GB",
          team: "1TB",
          enterprise: "Unlimited",
        },
        usage_based: false,
      },
    ],
  },
  integrations: {
    title: "Integrations",
    features: [
      {
        title: "Connect to Google sheets",
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Connect to Notion Database",
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Payments with Stripe",
        plans: {
          free: "5% fee",
          pro: "No additional fee",
          team: "No additional fee",
          enterprise: "No additional fee",
        },
        usage_based: false,
      },
      {
        title: "Payments with Toss (for 🇰🇷)",
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Ticketing for Events",
        plans: {
          free: false,
          pro: false,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Inventory Management",
        plans: {
          free: false,
          pro: false,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "Custom Domain",
        plans: {
          free: false,
          pro: "$9 / domain / mo",
          team: "$9 / domain / mo",
          enterprise: "$9 / domain / mo",
        },
        usage_based: false,
      },
      {
        title: "Supabase Integration",
        plans: {
          free: false,
          pro: false,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
    ],
  },
  commingsoon: {
    title: "Channels",
    features: [
      {
        title: "Email Notifications",
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "SMS Notifications",
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "WhatsApp Notifications",
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: "KakaoTalk Notifications (for 🇰🇷)",
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
    ],
  },
};
