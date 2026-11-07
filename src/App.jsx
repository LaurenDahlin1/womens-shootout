import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarBlank,
  ChatCircle,
  CheckCircle,
  FirstAidKit,
  Heart,
  InstagramLogo,
  List,
  MapPin,
  Mountains,
  NavigationArrow,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import {
  COMMENT_MAX_LENGTH,
  isValidEmail,
  subscribeToMailerLite,
  truncateComments,
} from "./mailerlite.js";
import { submitContactForm } from "./contactForm.js";
import { pagePath, withBase } from "./paths.js";

const primaryNavItems = [
  { label: "The Ride", href: "/faq" },
  { label: "Founders Corner", href: "/founders" },
  { label: "Events", href: "/more-events" },
  { label: "Contact", href: "/contact" },
];

function isCurrentPath(href) {
  return pagePath() === href;
}

const emptyEvents = {
  upcoming: [],
  additionalShootout: [],
  sisterClubEvents: [],
};

const dataUrl = (file) => `${import.meta.env.BASE_URL}data/${file}`;

function useFeedData() {
  const [events, setEvents] = useState(emptyEvents);
  const [instagramPosts, setInstagramPosts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadJson(file, fallback) {
      try {
        const response = await fetch(dataUrl(file));
        if (!response.ok) return fallback;
        return await response.json();
      } catch {
        return fallback;
      }
    }

    Promise.all([
      loadJson("events.json", emptyEvents),
      loadJson("instagram.json", { posts: [] }),
    ]).then(([eventData, instagramData]) => {
      if (cancelled) return;
      setEvents({
        upcoming: eventData.upcoming ?? [],
        additionalShootout: eventData.additionalShootout ?? [],
        sisterClubEvents: eventData.sisterClubEvents ?? [],
      });
      setInstagramPosts(instagramData.posts ?? []);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, instagramPosts };
}

const localCalendarEvents = [
  { title: "Twist and Turn Crit", date: "Jan 3, 10 & 17", location: "Tucson, AZ" },
  { title: "Race Against Time TT", date: "Jan 30", location: "San Manuel, AZ" },
  { title: "La Clasica San Manuel", date: "Jan 31", location: "San Manuel, AZ" },
  { title: "Papanikolas ITT 20K", date: "Feb 7", location: "Picacho, AZ" },
  { title: "Valley of the Sun", date: "Feb 12–14", location: "Phoenix, AZ" },
  { title: "Tucson Bicycle Classic", date: "Feb 18–21", location: "Tucson, AZ" },
  { title: "Christian Cycling State Crit", date: "Mar 6", location: "Oro Valley, AZ" },
  { title: "Avra Valley ITT", date: "Mar 14", location: "Marana, AZ" },
  { title: "Bicycle Haus Criterium", date: "Mar 20", location: "Maricopa, AZ" },
  { title: "BR Spring Crit", date: "Apr 10", location: "Tucson, AZ" },
  { title: "State ITT Championship", date: "Apr 18", location: "Red Rocks, AZ" },
  { title: "Tour of the Gila", date: "Apr 28–May 2", location: "Silver City, NM" },
  { title: "Mt. Graham Hill Climb", date: "Sep 12", location: "Safford, AZ" },
  { title: "Sonoran Shred MTB XC", date: "Sep 18", location: "Vail, AZ" },
  { title: "Pecan ITT 20K", date: "Sep 19", location: "Red Rocks, AZ" },
  { title: "State TTT Championship", date: "Oct 10", location: "TBD" },
  { title: "Chino Grinder", date: "Oct 16", location: "Chino Valley, AZ" },
  { title: "Big E Memorial Fall Crit", date: "Oct 30", location: "Tucson, AZ" },
  { title: "Vuelta de San Manuel Fondo", date: "Nov 7", location: "San Manuel, AZ" },
  { title: "UA CX", date: "Dec 4–5", location: "Tucson, AZ" },
];

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function HeroMedia() {
  const isMobile = useMediaQuery("(max-width: 760px)");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const size = isMobile ? "mobile" : "desktop";
  const poster = withBase(`/assets/hero-ride-${size}-poster.webp`);

  if (reduceMotion) {
    return <img className="hero-media" src={poster} alt="Women riding together on a sunny Tucson morning" />;
  }

  return (
    <video
      key={size}
      className="hero-media"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-label="Women riding together on a sunny Tucson morning"
      disablePictureInPicture
    >
      <source src={withBase(`/assets/hero-ride-${size}.webm`)} type="video/webm" />
      <source src={withBase(`/assets/hero-ride-${size}.mp4`)} type="video/mp4" />
    </video>
  );
}

function formatEventDate(startsAt, timezone) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(startsAt));
}

function formatEventTime(startsAt, timezone) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(new Date(startsAt));
}

function EventCard({ event, onAction }) {
  const dateLabel = formatEventDate(event.startsAt, event.timezone);
  const timeLabel = formatEventTime(event.startsAt, event.timezone);

  return (
    <article className="event-card">
      <div className="event-card-top">
        <div className="strava-label"><NavigationArrow weight="fill" /> Strava</div>
        <time className="date-chip" dateTime={event.startsAt}>{dateLabel}</time>
      </div>
      <p className="event-club">Hosted by {event.clubName}</p>
      <h3 title={event.title}>{event.title}</h3>
      <div className="event-meta">
        <span><CalendarBlank weight="bold" /> {timeLabel}</span>
        <span><UsersThree weight="fill" /> {event.isWomenOnly ? "Women’s ride" : "Community ride"}</span>
      </div>
      <p className="event-description" title={event.description}>{event.description}</p>
      {event.stravaUrl ? (
        <a className="button button-primary event-action" href={event.stravaUrl} target="_blank" rel="noreferrer">
          View &amp; RSVP on Strava <ArrowRight />
        </a>
      ) : (
        <button className="button button-primary event-action" onClick={() => onAction(event)}>
          View &amp; RSVP on Strava <ArrowRight />
        </button>
      )}
    </article>
  );
}

function Brand({ href = "#top" }) {
  return (
    <a className="brand" href={href} aria-label="Women’s Shootout home">
      <img src={withBase("/assets/wso-wordmark.png")} alt="WSO Women’s Shootout" />
    </a>
  );
}

function SiteHeader({ menuOpen, onMenuToggle, onMenuClose, onJoin, isHome = false }) {
  return (
    <>
      <div className="topbar">Tucson, Arizona <span>•</span> Saturday morning road rides</div>
      <header className="site-header">
        <Brand href={isHome ? "#top" : withBase("/")} />
        <nav className={menuOpen ? "nav-open" : ""} aria-label="Primary navigation">
          {primaryNavItems.map(({ label, href }) => (
            <a key={href} href={withBase(href)} aria-current={isCurrentPath(href) ? "page" : undefined} onClick={onMenuClose}>{label}</a>
          ))}
          <button className="button button-primary nav-cta" onClick={onJoin}>Join Email List</button>
        </nav>
        <button className="icon-button menu-button" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={onMenuToggle}>
          {menuOpen ? <X size={24} /> : <List size={26} />}
        </button>
      </header>
    </>
  );
}

function SiteFooter() {
  return (
    <footer>
      <Brand href={withBase("/")} />
      <div className="footer-rule" />
      <nav aria-label="Footer navigation">
        {primaryNavItems.map(({ label, href }) => <a key={href} href={withBase(href)} aria-current={isCurrentPath(href) ? "page" : undefined}>{label}</a>)}
        <a href="https://www.instagram.com/womens.shootout.tucson/" target="_blank" rel="noreferrer" aria-label="Women’s Shootout Tucson on Instagram"><InstagramLogo size={23} /></a>
      </nav>
    </footer>
  );
}

function InteriorHero({ eyebrow, title, copy, mark }) {
  return (
    <section className="interior-hero">
      <div className="interior-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      <div className="interior-hero-mark" aria-hidden="true">{mark}</div>
      <img className="interior-line-art" src={withBase("/assets/hero-mountain-line.png")} alt="" />
    </section>
  );
}

function FounderCard({ initials, name, children, instagramUrl }) {
  const portrait = <span className="founder-avatar" aria-hidden="true">{initials}</span>;

  return (
    <article className="founder-card">
      {instagramUrl ? <a className="founder-avatar-link" href={instagramUrl} target="_blank" rel="noreferrer" aria-label={`${name} on Instagram`}>{portrait}</a> : portrait}
      <div>
        <p className="eyebrow">Co-founder</p>
        <h2>{name}</h2>
        <p>{children}</p>
        {instagramUrl && <a className="founder-instagram" href={instagramUrl} target="_blank" rel="noreferrer"><InstagramLogo /> @leandacave <ArrowRight /></a>}
      </div>
    </article>
  );
}

function FoundersPage({ headerProps }) {
  return (
    <main className="interior-page founders-page">
      <SiteHeader {...headerProps} />
      <InteriorHero eyebrow="The women who started it" title="Founders Corner" copy="Meet the Tucson women whose experience, generosity, and love of the road helped this community take shape." mark="FC" />
      <section className="founders-list" aria-label="Women’s Shootout founders">
        <FounderCard initials="LC" name="Leanda Cave" instagramUrl="https://www.instagram.com/leandacave/">
          A four-time triathlon world champion who spent years living and training in Tucson, Leanda helped shape Women’s Shootout around the confidence and joy that grow when women ride hard together.
        </FounderCard>
        <FounderCard initials="PA" name="Pam Alexander">
          Pam founded Tucson’s Pace Ranch, an endurance-sports facility that supports cycling development for underserved youth and women. Her community-first approach helped give Women’s Shootout a welcoming, lasting home.
        </FounderCard>
      </section>
      <SiteFooter />
    </main>
  );
}

function EmptyFeed({ title, children }) {
  return (
    <article className="empty-feed">
      <span className="empty-feed-mark"><NavigationArrow weight="fill" /></span>
      <div><h3>{title}</h3><p>{children}</p></div>
    </article>
  );
}

function MoreEventsPage({ headerProps, onEventAction, events }) {
  const additionalEvents = (events.additionalShootout ?? []).slice(0, 4);
  const upcoming = events.upcoming ?? [];
  const sisterClubEvents = events.sisterClubEvents ?? [];

  return (
    <main className="interior-page more-events-page">
      <SiteHeader {...headerProps} />
      <InteriorHero eyebrow="Keep riding" title="More Events" copy="One place for upcoming Shootout rides, our sister clubs, and women-friendly racing around Arizona." mark="+" />
      <div className="events-directory">
        <section className="event-directory-section">
          <div className="directory-heading"><p className="eyebrow">Women’s Shootout</p><h2>Upcoming</h2></div>
          {upcoming.length ? (
            <div className="event-grid">
              {upcoming.map((event) => <EventCard key={event.id} event={event} onAction={onEventAction} />)}
            </div>
          ) : (
            <EmptyFeed title="Upcoming rides">Public Strava events will appear here when the live club feed is connected.</EmptyFeed>
          )}
        </section>

        <section className="event-directory-section sister-section">
          <div className="directory-heading"><p className="eyebrow">Tucson cycling community</p><h2>From Our Sister Clubs</h2><p>Upcoming public Strava events from two local women’s ride communities.</p></div>
          {sisterClubEvents.length ? (
            <div className="event-grid">{sisterClubEvents.map((event) => <EventCard key={event.id} event={event} onAction={onEventAction} />)}</div>
          ) : (
            <div className="empty-feed-grid">
              <EmptyFeed title="Monthly Women’s Ride">Upcoming Strava events will appear here when the live club feed is connected.</EmptyFeed>
              <EmptyFeed title="Ladies on Lemmon">Upcoming Strava events will appear here when the live club feed is connected.</EmptyFeed>
            </div>
          )}
        </section>

        <section className="event-directory-section">
          <div className="directory-heading"><p className="eyebrow">Women’s Shootout</p><h2>More From Us</h2><p>Up to four additional public events from our Strava club.</p></div>
          {additionalEvents.length ? (
            <div className="event-grid">{additionalEvents.map((event) => <EventCard key={event.id} event={event} onAction={onEventAction} />)}</div>
          ) : (
            <EmptyFeed title="More rides coming soon">Additional Women’s Shootout events will appear here when the live Strava feed is connected.</EmptyFeed>
          )}
        </section>

        <section className="event-directory-section local-calendar-section">
          <div className="directory-heading">
            <p className="eyebrow">2027 tentative calendar</p>
            <h2>Local Women’s Rides and Races</h2>
            <p>One clean listing per event, with multi-day races shown as date ranges. Confirm details with the organizer before you travel.</p>
            <a className="calendar-source" href="https://www.azcycling.org/2027-calendar/" target="_blank" rel="noreferrer">View the source calendar <ArrowRight /></a>
          </div>
          <div className="local-event-list">
            {localCalendarEvents.map((event) => (
              <article className="local-event" key={`${event.title}-${event.date}`}>
                <time dateTime="2027">{event.date}<small>2027</small></time>
                <div><h3>{event.title}</h3><p><MapPin weight="fill" /> {event.location}</p></div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}

function FaqItem({ id, question, children }) {
  return (
    <details className="faq-item" id={id}>
      <summary><span>{question}</span><span className="faq-toggle" aria-hidden="true">+</span></summary>
      <div className="faq-answer">{children}</div>
    </details>
  );
}

function FaqPage() {
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    const item = document.getElementById(id);
    if (item instanceof HTMLDetailsElement) {
      item.open = true;
      item.scrollIntoView({ block: "start" });
    }
  }, []);

  return (
    <main className="faq-page">
      <div className="topbar">Tucson, Arizona <span>•</span> Saturday morning road rides</div>
      <header className="site-header faq-header">
        <Brand href={withBase("/")} />
        <a className="faq-back-link" href={withBase("/")}>Back to home <ArrowRight weight="bold" /></a>
      </header>

      <section className="faq-hero">
        <div className="faq-hero-copy">
          <p className="eyebrow">Women’s Shootout</p>
          <h1>Frequently Asked<br />Questions</h1>
          <p>A few quick answers before you roll out with us.</p>
        </div>
        <div className="faq-hero-mark" aria-hidden="true">?</div>
        <img className="faq-line-art" src={withBase("/assets/hero-mountain-line.png")} alt="" />
      </section>

      <section className="faq-list" aria-label="Frequently asked questions">
        <FaqItem question="How is this group different from the co-ed Shootout ride? Are you affiliated with Fair Wheel Bikes?">
          <p>We ride with the blessing of Fair Wheel Bikes, but the Women’s Shootout (WSO) is distinct from the main Shootout ride and is not run by Fair Wheel Bikes.</p>
          <p>Our mission is to help women become more confident with group riding and to support the women’s cycling community in Tucson. Women affiliated with any bike shop or cycling team are encouraged to come to WSO.</p>
          <p>We usually start from the Mercado San Agustín (MSA) Annex. On the second Saturday of the month, we are trying out riding after the co-ed Shootout B group (“Old Man”), starting at University Avenue and Euclid Avenue.</p>
          <p><strong>Pace compared with the main Shootout:</strong> Our A group is slightly slower than the co-ed Shootout B group (“Old Man”). The cruising pace is similar, but we do not sprint as hard from lights or at the sprint points. Our B group is similar in average pace to the co-ed Shootout C group (“Old Old Man”). See <a href="#pace">What if the pace is not right for me?</a> for the full details.</p>
        </FaqItem>

        <FaqItem question="When do we ride?">
          <p>We ride every Saturday. Start times change seasonally with the temperature and sunrise. Note that we follow the “Old Man” group schedule from Fair Wheel Bikes.</p>
          <table className="faq-table">
            <thead>
              <tr><th>Seasonal change</th><th>Start time</th></tr>
            </thead>
            <tbody>
              <tr><td>First Saturday of March (March 6, 2027)</td><td>7:05 a.m.</td></tr>
              <tr><td>First Saturday of April (April 3, 2027)</td><td>6:35 a.m.</td></tr>
              <tr><td>Third Saturday of April (April 17, 2027)</td><td>6:05 a.m.</td></tr>
              <tr><td>First Saturday of September (September 4, 2027)</td><td>6:35 a.m.</td></tr>
              <tr><td>Second Saturday of October (October 9, 2027)</td><td>7:05 a.m.</td></tr>
              <tr><td>Second Saturday of November (November 13, 2027)</td><td>7:35 a.m.</td></tr>
            </tbody>
          </table>
          <p>Please arrive at least five minutes before rollout. First-time riders should allow extra time for parking, the restroom, and introductions.</p>
          <p>Check the current Strava event before every ride. Special events, weather, or other circumstances may occasionally change the published time.</p>
        </FaqItem>

        <FaqItem question="Where do we start?">
          <p>We are trying a new two-location model:</p>
          <ul>
            <li><strong>Second Saturday of each month:</strong> University Avenue and Euclid Avenue. Use <strong>845 E. University Boulevard</strong> for GPS navigation.</li>
            <li><strong>Every other Saturday:</strong> <a href="https://mercadodistrict.com/location/msa-annex/" target="_blank" rel="noreferrer">MSA Annex</a>, 267 S. Avenida del Convento.</li>
          </ul>
          <p>We previously started in front of Mercado San Agustín and Seis Kitchen. We now start at the MSA Annex because the Annex has generously given us early access to its restrooms.</p>
          <p>In 2027, the University and Euclid rides will be January 9, February 13, March 13, April 10, May 8, June 12, July 10, August 14, September 11, October 9, November 13, and December 11.</p>
        </FaqItem>

        <FaqItem question="Where should I park?">
          <p><strong>University and Euclid:</strong> Street parking is available around the University of Arizona campus near 845 E. University. Give yourself extra time to find a legal space and ride to the meeting point.</p>
          <p>Another option is to park at the Mercado, ride to the University and Euclid start, and finish your ride back at the Mercado, which is a fun place to relax, eat, or get a drink afterward. The connection to the start is approximately 2.7 miles and takes about 15 minutes. Follow the <a href="https://ridewithgps.com/routes/57823726?via=MhlwpxHPKMNdlefITyeVQg" target="_blank" rel="noreferrer">Mercado-to-University and Euclid route</a> and allow enough time to reach the group before rollout.</p>
          <p><strong>MSA Annex:</strong> Paid parking is available in the Mercado parking lots. Free street parking can also be found on surrounding side streets. Please observe posted restrictions and avoid blocking neighborhood driveways.</p>
          <p>Do not leave valuables visible in your vehicle.</p>
        </FaqItem>

        <FaqItem question="Are bathrooms available?">
          <p>Yes, bathrooms are available at both starts.</p>
          <p><strong>University and Euclid:</strong> The best option is the <a href="https://www.marriott.com/en-us/hotels/tusmp-tucson-marriott-university-park/overview/" target="_blank" rel="noreferrer">Tucson Marriott University Park</a> at 880 E. Second Street. The hotel’s valet will watch your bike while you use the restroom.</p>
          <p><strong>MSA Annex:</strong> The Annex has given our group early access to a restroom. It requires a code; ask a ride leader for the current code when you arrive. Please help us maintain this privilege by leaving the facility clean and securely closed.</p>
        </FaqItem>

        <FaqItem question="How fast is the ride?">
          <p>The <strong>A group averages approximately 18–20 mph</strong>. When possible, we also support a <strong>B group averaging approximately 15–17 mph</strong>. Note that we do not always have an official B group because we do not always have enough B-level riders and ride leaders. However, we are doing our best to change this!</p>
          <p>These are overall averages, not maximum speeds. Expect the pace to rise during pulls, hills, and sprint sections. Terrain, wind, weather, and group composition can also affect the day’s speed.</p>
          <p>We would also love to have a C group one day, but it is very hard to find ride leaders for this pace group. People who ride a lot tend to move up in pace and then no longer want to lead the C group! If you are interested in championing a C group, please reach out!</p>
        </FaqItem>

        <FaqItem question="Is this a beginner ride?">
          <p>No. Ideally, riders should already have road-cycling and group-riding experience. However, we would love to help you get more experience if you are new to group riding. You should be comfortable (or willing to become comfortable) riding close to others, holding a predictable line, communicating hazards, rotating through a paceline, and completing the route independently if you are dropped.</p>
          <p>If you are new to this ride but have the necessary experience, arrive early and introduce yourself to a ride leader.</p>
        </FaqItem>

        <FaqItem question="What can I expect in the group?">
          <p>We usually ride in two lines and rotate.</p>
          <p>The rider at the front right is in the wind and doing the most work. When you are ready to finish your pull, move left and slide back through the left-hand line. Pulls may be long or short.</p>
          <p>If you cannot hold the group’s speed, communicate clearly and move safely out of the working line. Avoid sudden braking or abrupt changes of direction.</p>
        </FaqItem>

        <FaqItem question="Is this a no-drop ride?">
          <p>No. <strong>The Women’s Shootout is not a no-drop ride.</strong></p>
          <p>We generally wait up to five minutes to regroup at <strong>The Bridge</strong> and <strong>Sprint Hill</strong>. These are also our sprint points for friendly competition. Riders who arrive after the regroup has departed should be prepared to navigate and finish independently.</p>
          <p>Save the route before leaving and carry a charged phone.</p>
        </FaqItem>

        <FaqItem question="How long is the ride?">
          <p>Distances depend on the starting location and turnaround selected.</p>
          <p><strong>From University and Euclid on second Saturdays:</strong></p>
          <ul>
            <li>Mid-distance option to Sprint Hill: approximately 55 miles</li>
            <li>Long option: approximately 68 miles</li>
          </ul>
          <p>The route has an out-and-back or lollipop structure, so riders can turn around earlier. Confirm the current turnaround points in the Strava event before rollout.</p>
          <p><strong>From the MSA Annex on other Saturdays, approximate round-trip options are:</strong></p>
          <ul>
            <li>The Bridge: 32 miles</li>
            <li>Helmet Peak Road: 42 miles</li>
            <li>Sprint Hill: 49 miles</li>
            <li>Full route: approximately 65 miles</li>
          </ul>
          <p>Distances may vary slightly with route changes, construction, or the precise start and finish. Follow the current Strava route rather than relying only on these estimates.</p>
        </FaqItem>

        <FaqItem question="Are there regroup points or sprint points?">
          <p>Yes. The principal regroup points are The Bridge and Sprint Hill. The group generally waits up to five minutes at each.</p>
          <p>Both locations are also friendly sprint points. Participation in the sprint is optional. Ride predictably and maintain awareness of traffic and other riders.</p>
        </FaqItem>

        <FaqItem question="Are there food or water stops?">
          <p>Riders completing the full route usually stop at a the <a href="https://maps.app.goo.gl/hMmA2ZAt5YDR7kRA6" target="_blank" rel="noreferrer">Circle K gas station in Sahuarita</a> around the halfway point.</p>
          <p>If you are turning around earlier, plan to carry all the food and water you need. There aren’t any gas stations on Mission Road once we leave town.</p>
        </FaqItem>

        <FaqItem question="Is the ride supported?">
          <p>No. This is a self-supported group ride. Bring:</p>
          <ul>
            <li>A helmet</li>
            <li>Adequate food and water</li>
            <li>A spare tube or tubeless repair kit</li>
            <li>Tire levers and inflation</li>
            <li>Basic tools</li>
            <li>A charged phone</li>
            <li>Identification and emergency-contact information</li>
            <li>A card or cash</li>
            <li>Sun protection</li>
            <li>The current route on your phone or bike computer</li>
          </ul>
          <p>Other riders may choose to help with a mechanical problem, but assistance and transportation are not guaranteed.</p>
        </FaqItem>

        <FaqItem question="What kind of bike should I bring?">
          <p>Bring a safe, well-maintained bike suitable for a brisk paved road ride. A road bike is the most appropriate choice.</p>
          <p>We are frequently asked about gravel bikes. You can definitely ride a gravel bike. However, please be aware that the A group is fast enough that most women riding gravel bikes will be dropped unless you are very strong. If you are a strong rider, you will keep up with the B group on a gravel bike.</p>
          <p>Note that tri bikes are generally NOT allowed. From time to time we make an exception, but it is not safe to be riding close in a group on a tri bike.</p>
        </FaqItem>

        <FaqItem question="Who is the ride for?">
          <p>The Women’s Shootout is a community road ride for women, trans, and femme cyclists with prior road and group-riding experience.</p>
        </FaqItem>

        <FaqItem question="Is there a fee or registration?">
          <p>The ride is free. Advance registration is generally not required, but riders should review the current Strava event for that week’s location, route, pace groups, and announcements.</p>
        </FaqItem>

        <FaqItem id="pace" question="What if the pace is not right for me?">
          <p><strong>Note on our pace vs the main Shootout groups:</strong> The Women’s Shootout A group is slightly slower than the co-ed Shootout B group (“Old Man”). Our cruising pace is similar but we do not sprint as hard starting up at lights or at the sprint points. The B group is similar to the co-ed Shootout C group (“Old Old Man”), but the co-ed C group also tends to have some much slower riders.</p>
          <p><strong>Too slow:</strong> When we start at the Annex (most weeks except the second Saturday), you can join either the co-ed Shootout A group or the co-ed Shootout B group as they pass us. The B group usually catches us as we are making our first stop. (Note they do not stop at all.) On second Saturdays, when we start after the Shootout B group, you have fewer options. You can turn down Helmet Peak road and ride in reverse until you see the A or B shootout groups.</p>
          <p><strong>Too fast:</strong> You will almost always be able to jump into the co-ed Shootout C group. Although our B group is similar in average pace to the co-ed C group, there are also usually co-ed riders riding much slower than the average pace.</p>
        </FaqItem>

        <FaqItem question="How do I confirm the latest information?">
          <p>Always check the current Strava event before leaving home on our <a href="https://www.strava.com/clubs/womensshootout" target="_blank" rel="noreferrer">Strava page</a>. That is where we publish the exact start time, starting location, route, available pace groups, and any ride-day changes.</p>
          <p>You can also follow <a href="https://www.instagram.com/womens.shootout.tucson/" target="_blank" rel="noreferrer">@womens.shootout.tucson</a> on Instagram.</p>
        </FaqItem>

        <FaqItem question="I have another question or want to become a ride leader. Who should I contact?">
          <p>Email <a href="mailto:wso.tucson@gmail.com">wso.tucson@gmail.com</a>.</p>
        </FaqItem>
      </section>

      <footer className="faq-footer">
        <Brand href={withBase("/")} />
        <div className="footer-rule" />
        <a href={withBase("/")}>Women’s Shootout · Tucson, Arizona</a>
      </footer>
    </main>
  );
}

function ContactPage({ headerProps }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.elements.namedItem("company").value.trim()) {
      setSubmitted(true);
      return;
    }

    const firstName = form.elements.namedItem("first_name").value.trim();
    const lastName = form.elements.namedItem("last_name").value.trim();
    const email = form.elements.namedItem("email").value.trim();
    const subject = form.elements.namedItem("subject").value.trim();
    const message = form.elements.namedItem("message").value.trim();

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitContactForm({ firstName, lastName, email, subject, message });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="interior-page contact-page">
      <SiteHeader {...headerProps} />
      <InteriorHero eyebrow="Write to us" title="Contact" copy="Questions about Saturday’s ride, a pace group, or becoming a ride leader. Send a note and we’ll write back." mark="Hi" />
      <section className="contact-section" aria-label="Contact form">
        <div className="contact-card">
          {submitted ? (
            <div className="success-state contact-success">
              <CheckCircle size={48} weight="fill" />
              <p className="eyebrow">Message sent</p>
              <h2>We’ll be in touch.</h2>
              <p>Thanks for writing. We’ll reply to the email you entered.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="signup-name-row">
                <label>First Name<input name="first_name" required autoComplete="given-name" maxLength={80} placeholder="First name" /></label>
                <label>Last Name<input name="last_name" required autoComplete="family-name" maxLength={80} placeholder="Last name" /></label>
              </div>
              <label>Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  maxLength={200}
                  placeholder="you@example.com"
                  onChange={() => { if (error) setError(""); }}
                />
              </label>
              <label>Subject<input name="subject" required maxLength={150} placeholder="What’s this about?" /></label>
              <label>Message<textarea name="message" required rows={6} maxLength={2000} placeholder="Your message" /></label>
              <label className="contact-honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="button button-primary full-button" type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send message"}
              </button>
            </form>
          )}
        </div>
        <p className="contact-alt">Or email <a href="mailto:wso.tucson@gmail.com">wso.tucson@gmail.com</a>.</p>
      </section>
      <SiteFooter />
    </main>
  );
}

function SignupModal({ open, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setSubmitting(false);
      setError("");
      setComments("");
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const firstName = form.elements.namedItem("first_name").value.trim();
    const lastName = form.elements.namedItem("last_name").value.trim();
    const email = form.elements.namedItem("email").value.trim();
    const truncatedComments = truncateComments(comments);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await subscribeToMailerLite({
        firstName,
        lastName,
        email,
        comments: truncatedComments,
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not join the list. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="signup-modal" role="dialog" aria-modal="true" aria-labelledby="join-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close join form"><X size={22} /></button>
        {submitted ? (
          <div className="success-state">
            <CheckCircle size={48} weight="fill" />
            <p className="eyebrow">You’re on the list</p>
            <h2 id="join-title">See you Saturday.</h2>
            <p>Check your inbox to confirm, then we’ll send the meetup point, route link, and a friendly reminder before the ride.</p>
            <button className="button button-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <p className="eyebrow">Join Email List</p>
            <h2 id="join-title">Your Saturday crew is waiting.</h2>
            <p>Stay up to date on our rides and women’s road cycling in Arizona. 1-2 emails per month.</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="signup-name-row">
                <label>First Name<input name="first_name" required autoComplete="given-name" placeholder="First name" autoFocus /></label>
                <label>Last Name<input name="last_name" required autoComplete="family-name" placeholder="Last name" /></label>
              </div>
              <label>Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  onChange={() => { if (error) setError(""); }}
                />
              </label>
              <label>Any questions or comments for us? (Optional)
                <textarea
                  name="comments"
                  rows={4}
                  maxLength={COMMENT_MAX_LENGTH}
                  value={comments}
                  onChange={(event) => setComments(truncateComments(event.target.value))}
                  placeholder="Optional"
                />
                <span className="comment-count">{comments.length}/{COMMENT_MAX_LENGTH}</span>
              </label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="button button-primary full-button" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function InstagramPost({ post }) {
  const image = (
    <div className="social-image-wrap">
      <img src={withBase(post.image)} alt={post.alt} />
      <InstagramLogo className="instagram-corner" size={28} color="white" weight="bold" />
    </div>
  );

  return (
    <article className="social-card">
      {post.permalink ? (
        <a href={post.permalink} target="_blank" rel="noreferrer" aria-label="View this post on Instagram">{image}</a>
      ) : image}
      <p>{post.caption}</p>
      {(post.likes != null || post.comments != null) && (
        <div className="social-stats">
          {post.likes != null ? <span><Heart color="#f4512f" /> {post.likes}</span> : null}
          {post.comments != null ? <span><ChatCircle /> {post.comments}</span> : null}
        </div>
      )}
    </article>
  );
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { events, instagramPosts } = useFeedData();
  const pathname = pagePath();

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  if (pathname === "/faq") return <FaqPage />;

  const headerProps = {
    menuOpen,
    onMenuToggle: () => setMenuOpen((value) => !value),
    onMenuClose: () => setMenuOpen(false),
    onJoin: () => setSignupOpen(true),
  };
  const handleEventAction = (selectedEvent) => showToast(`${selectedEvent.title} will open on Strava when the live event feed is connected.`);

  if (pathname === "/founders") {
    return <><FoundersPage headerProps={headerProps} /><SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} /></>;
  }

  if (pathname === "/more-events") {
    return <><MoreEventsPage headerProps={headerProps} onEventAction={handleEventAction} events={events} />{toast && <div className="toast" role="status"><CheckCircle weight="fill" /> {toast}</div>}<SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} /></>;
  }

  if (pathname === "/contact") {
    return <><ContactPage headerProps={headerProps} /><SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} /></>;
  }

  return (
    <main id="top">
      <SiteHeader {...headerProps} isHome />

      <section className="hero" id="ride">
        <div className="hero-copy">
          <p className="eyebrow">Every Saturday · Tucson, Arizona</p>
          <h1>Good rides.<br />Great women.</h1>
          <h2>Not just a ride, a community</h2>
          <p>Based in Tucson, Arizona, we ride the <a className="hero-inline-link" href="https://www.youtube.com/watch?v=MQb8mezEbiM" target="_blank" rel="noreferrer">world-famous Shootout</a> route and bring together women who love to ride road bikes, build fitness, and explore.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => setSignupOpen(true)}>Join Email List <ArrowRight weight="bold" /></button>
            <a className="button button-outline" href={withBase("/faq")}>Ride FAQ</a>
          </div>
          <img className="hero-line-art" src={withBase("/assets/hero-mountain-line.png")} alt="" />
        </div>
        <div className="hero-image">
          <HeroMedia />
          <div className="sun-badge">Every<br />Saturday</div>
        </div>
      </section>

      <section className="events-section section-shell" id="events">
        <div className="section-heading">
          <h2>Coming up on Strava</h2>
          <div className="heading-rule" />
          <p>Connect with us on Strava for up to date ride announcements and cancellations. RSVPs encouraged.</p>
        </div>
        {events.upcoming.length ? (
          <div className="event-grid">
            {events.upcoming.map((event) => (
              <EventCard
                event={event}
                key={event.id}
                onAction={handleEventAction}
              />
            ))}
          </div>
        ) : (
          <EmptyFeed title="Upcoming rides">Public Strava events will appear here when the live club feed is connected.</EmptyFeed>
        )}
      </section>

      <section className="community-section section-shell" id="community">
        <div className="section-heading community-heading">
          <h2>Smiles for miles</h2>
          <div className="heading-rule" />
          <p className="instagram-label"><InstagramLogo size={34} /> <span>Follow us on Instagram<br /><a href="https://www.instagram.com/womens.shootout.tucson/" target="_blank" rel="noreferrer">@womens.shootout.tucson</a><small className="instagram-note">New handle — we’ll follow you back.</small></span></p>
        </div>
        {instagramPosts.length ? (
          <div className="social-grid">
            {instagramPosts.slice(0, 3).map((post) => <InstagramPost post={post} key={post.id} />)}
          </div>
        ) : (
          <EmptyFeed title="Follow along">Recent posts from @womens.shootout.tucson will appear here when the live feed is connected.</EmptyFeed>
        )}
      </section>

      <section className="new-here" id="about">
        <div className="new-here-title"><h2>New here?<br />Start here.</h2><img className="hand-stroke" src={withBase("/assets/brush-underline.png")} alt="" /></div>
        <div className="new-here-tip"><UsersThree size={43} /><h3>Group ride experience</h3><p>Comfortable riding in a group at a steady, conversational pace.</p></div>
        <div className="new-here-tip"><Mountains size={43} /><h3>Know the route</h3><p>Check the Strava event for distance, elevation, and route details before you ride.</p></div>
        <div className="new-here-tip"><FirstAidKit size={43} /><h3>Bring water &amp; supplies</h3><p>Come prepared with water, nutrition, a tube or repair kit, and a charged phone.</p></div>
        <div className="meet-card">
          <div className="meet-card-heading"><MapPin size={28} /><p><strong>Where we meet</strong><span>Check the Saturday schedule</span></p></div>
          <div className="meet-points">
            <div className="meet-point">
              <span className="meet-day">Most Saturdays</span>
              <p><strong>MSA Annex (Mercado)</strong><br />Tucson, AZ</p>
            </div>
            <div className="meet-point meet-point-alt">
              <span className="meet-day">Second Saturday</span>
              <p><strong>University &amp; Euclid</strong><br />Tucson, AZ</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bottom-cta">
        <div className="bottom-cta-image" />
        <h2>Show up. Clip in.<br />Find your crew.</h2>
        <div className="bottom-cta-copy">
          <p>A women’s road cycling community in Tucson.</p>
          <a className="button button-primary" href="https://www.strava.com/clubs/womensshootout" target="_blank" rel="noreferrer">Ride With Us <ArrowRight /></a>
        </div>
      </section>

      <SiteFooter />

      {toast && <div className="toast" role="status"><CheckCircle weight="fill" /> {toast}</div>}
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </main>
  );
}
