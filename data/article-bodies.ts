/**
 * Real article bodies for the Herald UADP service.
 * Each key matches a title from the seed categoryPool.
 * Content is realistic, factual-sounding, and useful for
 * comparison/summarization demos in Astral.
 */

export const ARTICLE_BODIES: Record<string, string> = {

// ── TECHNOLOGY ─────────────────────────────────────────────────────────

"MacBook Pro M5 Pro and M5 Max: Apple's Fusion Architecture changes everything": `
Apple's latest MacBook Pro lineup marks a fundamental shift in how the company designs silicon. The M5 Pro and M5 Max chips abandon the traditional monolithic die in favor of what Apple calls "Fusion Architecture" — a chiplet-based design that bonds CPU, GPU, and Neural Engine tiles using a new ultra-dense interconnect fabric running at 1.2 TB/s.

## Performance Numbers

In our testing, the M5 Pro (14-core CPU, 20-core GPU) delivered a 42% improvement in Cinebench R24 multi-core over the M4 Pro, while single-core performance jumped 18%. The M5 Max, aimed at professional video and 3D workloads, packs 40 GPU cores and 64GB of unified memory — enough to run a full Stable Diffusion XL pipeline locally in under 8 seconds per image.

Real-world benchmarks tell the story better than synthetics: a 4K ProRes timeline with 15 layers of graded footage plays back in real time without proxies. Xcode compilation of a 2-million-line Swift project completes in 4 minutes 12 seconds, down from 6:45 on M4 Max.

## Battery Life

Despite the raw power increase, Apple claims 22 hours of video playback on the 16-inch model. Our mixed-use test (coding, browsing, Slack, occasional builds) yielded 14.5 hours — an hour more than the M4 Pro equivalent.

## Pricing and Value

The M5 Pro 14-inch starts at $2,399 (same as last year), while the M5 Max 16-inch tops out at $4,999 with 128GB unified memory. For professionals who bill by the hour, the time savings on compilation and rendering pay for the upgrade within months.

The question isn't whether the M5 is faster — it unquestionably is. The question is whether Apple's new chiplet approach gives them a structural advantage over AMD and Intel that compounds with each generation.
`.trim(),

"The era of AI agents: what it means for developers": `
The shift from chatbots to autonomous AI agents represents the most significant change in how software gets built since the cloud transition. Unlike traditional LLM applications that respond to prompts, agents maintain state, use tools, make decisions, and execute multi-step plans — all with minimal human oversight.

## What's Different About Agents

A chatbot answers questions. An agent books your flight, checks your calendar for conflicts, sends the confirmation to your travel expense system, and updates your team on Slack — all from a single request. The technical stack is fundamentally different: agents need memory (short and long-term), tool integration (APIs, databases, browsers), planning capabilities, and error recovery.

## The Developer Landscape in 2026

Frameworks like LangChain, CrewAI, and AutoGen have matured significantly. The emerging pattern is orchestrator-workers: a central agent that understands intent and delegates to specialized sub-agents. Each sub-agent has its own tool set and system prompt optimized for a narrow domain (email, calendar, shopping, coding).

Companies building agent infrastructure — Anthropic (with tool use), OpenAI (with Assistants API), and smaller players like Fixie and Dust — are competing on reliability, not just capability. The hard problem isn't making an agent that works 80% of the time; it's making one that fails gracefully the other 20%.

## What Developers Should Learn

If you're a developer in 2026, the skills that matter most are: structured output design (making LLMs return predictable JSON), tool definition (clear parameter names, unambiguous descriptions), and observability (logging every decision an agent makes so you can debug it). Traditional prompt engineering is table stakes — the real value is in system design.

The developers who thrive will be the ones who think of LLMs as unreliable but powerful components in a larger system, not as magical black boxes.
`.trim(),

"AI startups raise $12B in Q1 2026": `
The first quarter of 2026 saw AI startups raise a combined $12.3 billion across 847 deals, according to PitchBook data — a 67% increase over Q1 2025 and the highest quarterly total ever recorded for the sector.

## Where the Money Went

Infrastructure companies captured 44% of total funding. Foundation model labs (Anthropic, Mistral, Cohere) continue to attract mega-rounds, but the fastest-growing segment is AI tooling: companies building deployment, monitoring, and evaluation platforms for enterprises. Notable raises include Weights & Biases ($400M Series E), Braintrust ($180M Series C), and Modal ($150M Series B).

Application-layer startups took 38% of funding, with healthcare AI ($1.8B), legal tech ($1.2B), and developer tools ($900M) leading verticals. The remaining 18% went to AI hardware companies, particularly those designing inference-optimized chips to compete with NVIDIA.

## Valuations Under Scrutiny

Despite record fundraising, median pre-money valuations for Series A AI companies dropped 15% from Q4 2025. Investors are increasingly demanding proof of revenue retention: the "AI wrapper" companies that simply pipe OpenAI calls are struggling to raise, while companies with proprietary data moats or novel architectures command premiums.

## What It Means

The AI investment thesis has shifted from "fund everything with 'AI' in the pitch deck" to "fund companies with defensible technical advantages and proven enterprise demand." The money is real, but so is the scrutiny.
`.trim(),

// ── WORLD / GOVERNMENT ────────────────────────────────────────────────

"EU passes comprehensive AI regulation act": `
The European Union has formally adopted the Artificial Intelligence Act, making it the world's first binding legal framework specifically governing AI systems. The regulation, which enters full enforcement in August 2025 with a 24-month transition period, classifies AI applications into four risk tiers and imposes escalating compliance requirements.

## Risk Tiers Explained

**Unacceptable risk** (banned outright): AI systems that manipulate human behavior through subliminal techniques, government social scoring systems, and real-time biometric identification in public spaces (with narrow law enforcement exceptions).

**High risk** (strict compliance): AI used in critical infrastructure, education, employment, law enforcement, migration, and democratic processes. These systems must undergo conformity assessments, maintain human oversight, and provide detailed technical documentation. Companies deploying high-risk AI must register in an EU-wide database.

**Limited risk** (transparency obligations): Chatbots and deepfake generators must clearly disclose that content is AI-generated. Users must always know when they're interacting with AI.

**Minimal risk** (no restrictions): AI in spam filters, video game NPCs, and recommendation systems remains unregulated.

## Enforcement and Penalties

The European AI Office, established within the European Commission, oversees enforcement. Fines scale by violation severity: up to 7% of global annual turnover for deploying banned AI systems, 3% for non-compliance with high-risk requirements, and 1.5% for providing incorrect information.

## Global Impact

Technology companies operating globally must now decide whether to build separate AI pipelines for the EU market or adopt EU standards universally. Early indications suggest most major tech firms (Google, Microsoft, Meta, Apple) will choose universal compliance — making the EU's framework the de facto global standard, similar to how GDPR shaped privacy law worldwide.

Critics argue the regulation could slow European AI innovation, pointing to the compliance costs for startups. Supporters counter that trustworthy AI is a competitive advantage: European consumers and enterprises will prefer systems that meet the highest safety standards.
`.trim(),

"India becomes the world's third-largest economy": `
India has officially surpassed Japan to become the world's third-largest economy by nominal GDP, reaching $4.18 trillion in 2025. The milestone, confirmed by IMF data released this quarter, cements a trajectory that economists had forecast since 2022 but that was accelerated by India's rapid digitization and manufacturing expansion.

## The Growth Drivers

Three sectors powered the ascent. First, digital services: India's IT and business process outsourcing industry grew 14% year-over-year, driven by AI-related demand from Western enterprises seeking lower-cost engineering talent. Second, manufacturing: the Production-Linked Incentive (PLI) scheme attracted $28 billion in foreign direct investment since 2021, particularly in semiconductors, electronics, and electric vehicles. Third, domestic consumption: India's 1.4 billion population, with a median age of 28, represents the world's largest consumer growth market.

## Challenges Ahead

Despite the headline number, India's per-capita GDP remains $2,900 — a fraction of Japan's $34,000. Income inequality has widened, with the top 10% capturing 57% of national income. Infrastructure gaps persist: 25% of the population lacks reliable electricity, and the road network, while expanding rapidly, still trails China's by a factor of three.

The rupee appreciated 8% against the dollar over the past year, creating headwinds for the export-dependent IT sector. The Reserve Bank of India faces a balancing act: supporting growth while preventing the currency from becoming uncompetitively strong.

## What It Means

India's rise to number three is symbolic but meaningful. It signals to global businesses that the country is no longer a "future opportunity" — it's a present one. The companies and investors positioning themselves now will benefit from what could be two decades of sustained 6-7% annual growth.
`.trim(),

// ── PRODUCT COMPARISONS (key for Astral demo) ────────────────────────

"iPhone 17 Pro vs Samsung Galaxy S27 Ultra: the definitive comparison": `
Two months after both flagships hit the market, we've had enough time to move past first impressions and assess which phone actually delivers the better experience in daily use. Here's our comprehensive comparison after 60 days with both devices.

## Design and Build

The iPhone 17 Pro introduces titanium grade 5 across the entire frame (up from grade 2 in the 16 Pro) with a marginally thinner 7.9mm profile. The new Dynamic Island is 15% smaller thanks to under-display Face ID components. The Samsung Galaxy S27 Ultra retains its squared-off design but finally rounds the corners slightly, making it more comfortable to hold. Both phones feel premium, but the S27 Ultra's 6.9-inch display dwarfs the iPhone's 6.3-inch panel.

## Camera

Apple's 48MP main sensor with stacked CMOS design produces noticeably cleaner low-light shots than last year. The new 5x telephoto (replacing the 3x on the base Pro model) closes the zoom gap with Samsung. However, the S27 Ultra's 200MP main sensor still resolves more detail in daylight, and its 10x optical zoom remains unmatched. Video is where Apple pulls ahead: ProRes Log at 4K/120fps enables a cinematic workflow that Samsung simply can't match.

## Performance

The A19 Pro chip (3nm, second generation) scores 2,850 single-core in Geekbench 6, while the Snapdragon 8 Gen 5 in the S27 Ultra hits 2,720. In practice, both phones are absurdly fast — the performance gap only shows in sustained workloads like video export, where Apple's thermal management keeps the chip running at peak longer.

## AI Features

This is the biggest differentiator in 2026. Apple Intelligence now handles email summarization, photo editing suggestions, and Siri contextual actions natively on-device. Samsung's Galaxy AI relies more heavily on cloud processing but offers broader language support (34 vs Apple's 12) and integrates with Google's Gemini for open-ended tasks. Neither is perfect, but Apple's privacy-first approach appeals to enterprise users.

## Battery Life

The S27 Ultra's 5,500mAh battery consistently outlasts the iPhone 17 Pro (3,700mAh) by 2-3 hours in mixed use. Samsung's 65W wired charging fills the tank in 35 minutes; Apple's 35W MagSafe takes about 70 minutes. If battery anxiety is your thing, Samsung wins handily.

## The Verdict

Buy the iPhone 17 Pro if: you're invested in Apple's ecosystem, prioritize video recording, or value on-device AI privacy. Buy the Galaxy S27 Ultra if: you want the best display, longest battery life, or need Samsung DeX as a laptop replacement. Both are excellent — the "wrong" choice doesn't exist here.
`.trim(),

// ── SCIENCE ──────────────────────────────────────────────────────────

"Quantum computing reaches 1000-qubit milestone": `
IBM has unveiled its Condor processor, the world's first quantum computing chip to surpass 1,000 superconducting qubits — a milestone the industry has pursued for over a decade. But the raw qubit count tells only part of the story. The more significant achievement is the chip's error rate: 0.1% per two-qubit gate, down from 0.5% in the previous 433-qubit Heron processor.

## Why 1,000 Qubits Matters

Below ~1,000 qubits, quantum computers can only solve toy problems faster than classical machines. Above this threshold, with sufficiently low error rates, they enter the regime where quantum error correction becomes practical. IBM's roadmap calls for a 100,000-qubit machine by 2033 using modular interconnects between multiple Condor-class chips.

Google's competing approach uses a different architecture (topological qubits via Majorana fermions) that promises inherently lower error rates but has proven harder to scale. Intel, meanwhile, is betting on silicon spin qubits that could be manufactured in existing chip fabs — a potentially cheaper path to scale.

## Real-World Applications

At 1,000 error-corrected qubits, quantum computing becomes useful for molecular simulation (drug discovery, materials science), optimization problems (logistics, financial portfolio management), and certain machine learning tasks. Pharmaceutical company Roche has already reserved access to IBM's cloud-based quantum services for protein folding simulations.

## The Skeptic's View

Not everyone is celebrating. Quantum physicist Scott Aaronson cautions that "1,000 physical qubits is not the same as 1,000 logical qubits" — you need roughly 1,000 physical qubits to create a single reliable logical qubit with current error correction codes. True quantum advantage for commercially relevant problems likely requires millions of physical qubits, still a decade away.

The milestone is real, but the hype cycle is equally real. Smart observers watch the error rates more closely than the qubit count.
`.trim(),

"Fusion reactor achieves net energy gain for second time": `
The National Ignition Facility (NIF) at Lawrence Livermore National Laboratory has confirmed a second successful fusion ignition experiment, producing 4.2 megajoules of energy from 2.05 megajoules of laser input — a gain factor of 2.05x. The first breakthrough in December 2022 achieved a gain of 1.5x, meaning progress is accelerating.

## How It Works

NIF uses inertial confinement fusion: 192 high-powered lasers converge on a fuel capsule smaller than a peppercorn, containing deuterium and tritium. The lasers compress the capsule to densities 100 times that of lead, reaching temperatures of 100 million degrees — conditions found only in the cores of stars. At these extremes, hydrogen nuclei fuse into helium, releasing energy.

## The Energy Math

While 4.2 MJ sounds impressive, context matters. The lasers that delivered 2.05 MJ of energy to the target consumed approximately 300 MJ of electrical energy from the grid. So the "net gain" only counts the energy balance at the fuel capsule, not the end-to-end system efficiency. Achieving wall-plug gain — more electricity out than in — requires fundamentally different reactor designs that can fire continuously, not once per day.

## The Path to a Power Plant

Private fusion companies (Commonwealth Fusion Systems, TAE Technologies, Helion Energy) are pursuing magnetic confinement approaches that could fire continuously. Commonwealth's SPARC tokamak, under construction in Massachusetts, aims for first plasma in 2027 and a grid-connected pilot plant by 2032. If successful, fusion power could supply baseload electricity at costs competitive with natural gas — roughly $60/MWh — without greenhouse emissions or long-lived radioactive waste.

## Why It Matters Now

The second ignition at higher gain proves the first wasn't a fluke. It validates the physics. The engineering challenge — building a reactor that harnesses this reaction economically — remains immense, but for the first time, the question has shifted from "can fusion work?" to "how soon can we scale it?"
`.trim(),

// ── HEALTH ──────────────────────────────────────────────────────────

"Universal flu vaccine enters phase 3 clinical trials": `
A universal influenza vaccine developed by the National Institutes of Health and Moderna has entered phase 3 clinical trials across 28,000 participants in 12 countries. Unlike seasonal flu shots that target specific strains and must be reformulated annually, this vaccine targets the conserved stalk region of the hemagglutinin protein — a structure shared by virtually all influenza A and B variants.

## How It Works

Current flu vaccines target the head of the hemagglutinin protein, which mutates rapidly through antigenic drift. This is why last season's shot may be only 40-60% effective. The universal approach uses mRNA technology (the same platform as Moderna's COVID vaccines) to present the stalk region to the immune system. Because the stalk changes very slowly across strains, antibodies against it should provide broad, durable protection.

## Trial Design

The phase 3 trial compares the universal vaccine against the standard quadrivalent seasonal flu shot over two flu seasons (Southern and Northern Hemisphere). Primary endpoints are prevention of lab-confirmed influenza infection and reduction in hospitalizations. Secondary endpoints include cross-reactivity against avian influenza strains (H5N1, H7N9) — a critical measure given the ongoing bird flu concerns.

## If It Works

A single shot providing 5-10 years of protection against all flu strains would eliminate the annual vaccination guessing game, reduce the 290,000-650,000 flu deaths worldwide each year, and provide a standing defense against pandemic influenza. The economic impact would be substantial: the US alone spends $11 billion annually on flu-related healthcare costs and lost productivity.

## Timeline

If phase 3 results are positive (expected mid-2027), emergency use authorization could come by late 2027 with full approval in 2028. Manufacturing scale-up would leverage existing mRNA infrastructure built during the COVID pandemic, meaning global supply could ramp within 12-18 months of approval.
`.trim(),

// ── ECONOMY ──────────────────────────────────────────────────────────

"Fed holds interest rates steady at 4.5%": `
The Federal Reserve kept its benchmark interest rate unchanged at 4.50% for the third consecutive meeting, signaling that the central bank remains cautious about cutting rates despite inflation cooling to 2.1% — just above its 2% target.

## The Decision

The Federal Open Market Committee voted 11-1 to hold, with Cleveland Fed President dissenting in favor of a 25-basis-point cut. Chair Powell's press conference emphasized "data dependence," noting that while inflation has declined substantially from its 2022 peak of 9.1%, the labor market remains unusually tight with unemployment at 3.6%.

## Why Not Cut?

Three factors keep the Fed on hold. First, core services inflation (excluding housing) remains at 3.2%, suggesting underlying price pressures persist. Second, wage growth at 4.1% year-over-year, while moderating, still exceeds the ~3.5% rate the Fed considers consistent with 2% inflation. Third, fiscal spending (the CHIPS Act, IRA, and infrastructure bill) continues to inject demand into the economy, partially offsetting the restraining effect of high rates.

## Market Reaction

Bond markets had priced in a 35% probability of a cut, so the hold was not a surprise. The 10-year Treasury yield ticked up 5 basis points to 4.15%. Stock markets were flat, with the S&P 500 closing down 0.1%. The more telling reaction was in the dollar, which strengthened 0.4% against the euro — suggesting currency markets expect the ECB to cut before the Fed.

## Outlook

Fed dot plots now show two cuts in 2026 (down from three projected in December), with the first likely in September if inflation continues its downward trajectory. The Fed's message is clear: they'd rather hold too long than cut too early and risk reigniting inflation.
`.trim(),

};

/**
 * Generate a coherent article body for any title, even if it's not in
 * the hand-written pool. Uses the category to produce topically relevant
 * multi-paragraph content (much better than faker.lorem).
 */
const CATEGORY_TEMPLATES: Record<string, string[]> = {
  Technology: [
    "The technology landscape continues to evolve at a pace that challenges even the most agile organizations. Industry analysts point to three converging trends: the maturation of AI infrastructure, the shift toward edge computing, and the growing importance of developer experience as a competitive differentiator.",
    "Adoption rates tell the story. Enterprise spending on this category grew 34% year-over-year, with mid-market companies leading the charge. The total addressable market is projected to reach $180 billion by 2028, up from $95 billion today. Early adopters report 2-3x productivity gains in targeted workflows.",
    "The open source community has been instrumental in accelerating progress. GitHub data shows a 56% increase in contributions to related repositories, with the number of active contributors doubling since 2024. This grassroots momentum often predicts which technologies will dominate enterprise adoption 18-24 months later.",
    "Critics warn of overinvestment and hype cycles. The technology must prove its value beyond benchmark demos and pilot programs — real-world deployment at scale remains the ultimate test. Organizations that separate signal from noise will be best positioned to capture lasting value.",
  ],
  Economy: [
    "Financial markets are navigating an unusual confluence of factors: moderating inflation, resilient labor markets, and geopolitical uncertainty that keeps safe-haven assets in demand. The result is a market that moves sideways more than it trends, frustrating both bulls and bears.",
    "Data from Q1 2026 paints a nuanced picture. Consumer spending grew 2.8% year-over-year in real terms, with services outpacing goods for the eighth consecutive quarter. Business investment, however, has slowed — capital expenditure fell 4% as companies digest the infrastructure buildout of 2024-2025.",
    "Central banks face a credibility test. Having spent two years tightening aggressively, they must now communicate the transition to a neutral or easing stance without triggering market volatility. The consensus among 47 economists surveyed is that the first major rate cut comes in Q3 2026, but the timing depends on a handful of data points that could swing either way.",
    "For consumers and businesses, the practical implications are clear: borrowing costs will remain elevated through mid-2026, making capital allocation decisions critical. Companies with strong balance sheets and pricing power will outperform; those dependent on cheap financing face continued pressure.",
  ],
  World: [
    "Geopolitical shifts are redrawing the map of global influence. Traditional alliances are being tested by divergent economic interests, while new coalitions form around shared technology and trade priorities. The multipolar world that analysts predicted a decade ago is now the operating reality.",
    "The data reflects this transformation. Foreign direct investment flows shifted 22% toward the Global South in 2025, driven by demographic advantages, improving governance scores, and aggressive incentive packages. Countries that invested in digital infrastructure during the 2020s are now reaping outsized returns.",
    "Domestic politics in several major economies are adding complexity. Electoral cycles in 2026-2027 could alter trade policies, immigration frameworks, and climate commitments that businesses have built strategies around. Scenario planning has become essential for any company with cross-border operations.",
    "The throughline across these developments is institutional capacity: countries and regions that can implement policy efficiently — collecting taxes, enforcing contracts, building infrastructure — are pulling ahead. Governance quality, not just GDP, is becoming the metric that matters.",
  ],
  Science: [
    "Scientific progress often arrives in bursts: years of incremental work suddenly yield a breakthrough that reframes what's possible. This latest development follows a decade of foundational research and represents exactly that kind of inflection point.",
    "The methodology involved a combination of computational modeling and experimental validation. Researchers used machine learning to narrow the search space by three orders of magnitude, then conducted targeted experiments to confirm the predictions. This hybrid approach — computation-first, experiment-second — is becoming the standard playbook in modern science.",
    "Peer review and independent replication will be critical. The initial results are promising, but the scientific community has been burned by premature announcements before. Three independent labs are currently attempting to reproduce the findings, with results expected within six months.",
    "The practical applications, if the results hold, could be transformative. Industry partners have already committed $850 million in follow-up research and development. The timeline from laboratory to commercial application is estimated at 5-8 years — aggressive by historical standards but plausible given the manufacturing infrastructure already in place.",
  ],
  Health: [
    "Medical research continues to demonstrate that the convergence of AI, genomics, and traditional clinical practice is producing outcomes that would have seemed impossible a decade ago. This latest advance exemplifies the trend toward precision interventions that target root causes rather than managing symptoms.",
    "The clinical data is compelling. In a randomized controlled trial of 3,200 patients across 14 medical centers, the new approach showed a statistically significant improvement over the current standard of care (p < 0.001). Adverse events were comparable to the control group, addressing a key concern that had limited earlier approaches.",
    "Health economists estimate the annual savings at $4.2 billion in the US alone if adopted at scale, primarily through reduced hospitalizations and fewer downstream complications. Insurance companies have signaled willingness to cover the treatment, pending final regulatory approval.",
    "Patient advocacy groups have praised the development but caution that equitable access must be a priority. Previous breakthroughs have sometimes taken years to reach underserved communities. Researchers and policymakers are working on distribution frameworks to prevent this pattern from repeating.",
  ],
  Culture: [
    "Cultural shifts rarely announce themselves; they accumulate quietly until a tipping point makes them impossible to ignore. This development reflects a broader transformation in how people create, consume, and value cultural products in the digital age.",
    "The numbers are striking: participation in this space grew 78% over the past two years, with the fastest growth among 18-34 year olds. Revenue models are evolving in parallel, moving from advertising-dependent to subscription and direct-payment models that better align creator and audience incentives.",
    "Industry veterans see both opportunity and risk. The democratization of creative tools means more voices can be heard, but it also means more competition for attention. The winners will be those who build genuine communities rather than chasing algorithmic trends.",
    "The long-term impact on culture itself is harder to predict. What's clear is that the boundaries between creator and audience, between amateur and professional, are blurring in ways that will reshape creative industries for a generation.",
  ],
  Sports: [
    "The intersection of technology and athletic performance continues to push the boundaries of what humans can achieve. This latest development showcases how data analytics, biomechanics, and recovery science are being integrated into training programs at every level of competition.",
    "Performance data tells the story: athletes using the new approach showed a 12% improvement in key metrics compared to traditional training methods, with injury rates declining by 18%. The sample size of 450 athletes across 15 sports lends statistical confidence to the findings.",
    "Governing bodies are watching closely. The question of where technology-assisted performance crosses into unfair advantage is hotly debated. Current rules were written for a pre-data era and may need updating as these tools become more sophisticated and accessible.",
    "For fans, the result is a more exciting product: faster times, higher scores, and closer competitions. For athletes, it represents a new dimension of preparation that complements — but doesn't replace — the fundamental qualities of talent, dedication, and mental toughness.",
  ],
  Environment: [
    "Environmental science and policy are entering a new phase. The question is no longer whether climate change is happening or whether action is needed — it's whether the pace of change is fast enough to meet the targets that scientists say matter.",
    "The latest data shows measurable progress: global renewable energy capacity grew 28% in 2025, with solar alone adding more generation capacity than coal, gas, and nuclear combined. Electric vehicle sales crossed 20% of new car purchases worldwide. Carbon intensity of GDP fell 4.1% — the fastest annual decline on record.",
    "But the gap between current trajectory and Paris Agreement targets remains significant. Global emissions need to fall 43% by 2030 to limit warming to 1.5°C; the current trajectory projects a 12% reduction. The mismatch means more aggressive policy, faster technology deployment, or both.",
    "For businesses, the transition presents both risk and opportunity. Companies in carbon-intensive industries face stranded asset write-downs and regulatory costs. Those in clean technology are seeing valuations that reflect growth expectations rarely seen outside the tech sector.",
  ],
  Education: [
    "Education is undergoing its most significant transformation since the introduction of universal public schooling. Technology is not merely supplementing traditional methods — it's enabling fundamentally different approaches to how people learn, what they learn, and how their learning is credentialed.",
    "Outcome data from early adopters is encouraging. Students using the new approach scored 23% higher on standardized assessments and reported 35% greater engagement in surveys. Crucially, the gains were largest among students from disadvantaged backgrounds, suggesting the approach could help close persistent achievement gaps.",
    "Institutional resistance remains the primary barrier to adoption. Universities and school districts operate on multi-year planning cycles and face regulatory constraints that slow experimentation. The most successful implementations have come from institutions willing to run parallel tracks — offering the new approach alongside traditional methods and letting outcomes speak for themselves.",
    "The workforce implications are significant. Employers increasingly care about demonstrated skills rather than credentials from specific institutions. This shift creates an opening for alternative providers but also raises quality assurance questions that the education sector is still grappling with.",
  ],
};

export function generateArticleBody(title: string, category: string): string {
  // Check hand-written pool first
  if (ARTICLE_BODIES[title]) return `# ${title}\n\n${ARTICLE_BODIES[title]}`;

  // Also check partial matches (title contains key phrases from the pool)
  for (const [key, body] of Object.entries(ARTICLE_BODIES)) {
    if (title.toLowerCase().includes(key.toLowerCase().slice(0, 30))) {
      return `# ${title}\n\n${body}`;
    }
  }

  // Fallback: use category-specific coherent paragraphs
  const paragraphs = CATEGORY_TEMPLATES[category] ?? CATEGORY_TEMPLATES['Technology'];
  return `# ${title}\n\n${paragraphs.join('\n\n')}`;
}
