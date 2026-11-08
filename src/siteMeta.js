export const SITE_URL = "https://laurendahlin1.github.io/womens-shootout";
export const SITE_NAME = "Women’s Shootout";
export const OG_IMAGE = `${SITE_URL}/assets/og-image.jpg`;
export const OG_IMAGE_ALT = "Women’s Shootout riders in Tucson";
export const THEME_COLOR = "#bf4f30";

export const SOCIAL = {
  instagram: "https://www.instagram.com/womens.shootout.tucson/",
  strava: "https://www.strava.com/clubs/womensshootout",
  email: "wso.tucson@gmail.com",
};

export const pages = {
  "/": {
    title: "Women’s Shootout · Tucson",
    description:
      "A women’s road cycling community in Tucson, Arizona. Saturday morning rides, Strava events, and a crew that shows up.",
  },
  "/faq": {
    title: "Ride FAQ · Women’s Shootout Tucson",
    description:
      "Saturday start times, start locations, pace groups, route distances, and what to bring for the Women’s Shootout road ride in Tucson.",
  },
  "/founders": {
    title: "Founders Corner · Women’s Shootout Tucson",
    description:
      "Meet Leanda Cave and Pam Alexander, the Tucson women who founded Women’s Shootout in 2022.",
  },
  "/more-events": {
    title: "Rides and Events · Women’s Shootout Tucson",
    description:
      "Upcoming Women’s Shootout Saturday rides, sister-club events in Tucson, and women’s racing around Arizona.",
  },
  "/contact": {
    title: "Contact · Women’s Shootout Tucson",
    description:
      "Questions about Saturday’s ride, pace groups, or becoming a ride leader. Email Women’s Shootout in Tucson.",
  },
};

export function pageMeta(pathname) {
  return pages[pathname] ?? pages["/"];
}

export function canonicalUrl(pathname) {
  if (!pathname || pathname === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${pathname.replace(/\/$/, "")}/`;
}

export const sportsClubJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsClub",
  name: "Women's Shootout",
  alternateName: "WSO",
  url: `${SITE_URL}/`,
  email: SOCIAL.email,
  description: pages["/"].description,
  sport: "Cycling",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tucson",
    addressRegion: "AZ",
    addressCountry: "US",
  },
  sameAs: [SOCIAL.instagram, SOCIAL.strava],
};

export const faqPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "When do we ride?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Women’s Shootout rides every Saturday in Tucson. Start times change seasonally with temperature and sunrise. Check the current Strava event before every ride.",
      },
    },
    {
      "@type": "Question",
      name: "Where do we start?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most Saturdays start at the MSA Annex, 267 S. Avenida del Convento. On the second Saturday of each month the group starts at University Avenue and Euclid Avenue (845 E. University Boulevard for GPS).",
      },
    },
    {
      "@type": "Question",
      name: "How fast is the ride?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The A group averages about 18–20 mph. When possible, a B group averages about 15–17 mph. This is not a beginner or no-drop ride.",
      },
    },
    {
      "@type": "Question",
      name: "Who is the ride for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Women’s Shootout is a community road ride for women, trans, and femme cyclists with prior road and group-riding experience.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a fee or registration?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The ride is free. Advance registration is generally not required. Review the current Strava event for that week’s location, route, and pace groups.",
      },
    },
  ],
};
