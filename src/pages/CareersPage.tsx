import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { Briefcase, MapPin, Calendar, Clock, DollarSign, Send, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface JobVacancy {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salaryRange: string;
  datePosted: string;
  description: string;
  requirements: string[];
}

const CAREER_VACANCIES: JobVacancy[] = [
  {
    id: 'tailor-lead',
    title: "Industrial Tailoring Specialist (Lead Cutter)",
    department: "Production Floor",
    location: "Uhuru Market, Nairobi (On-site)",
    type: "Full-Time",
    salaryRange: "Ksh 35,000 - 45,000 / Month",
    datePosted: "2026-06-05",
    description: "We are seeking an experienced lead cutter and tailor to draft master patterns, optimize heavy fabric cutting blocks (PV, twills, and heavy drill), and supervise the sewing crew. The role ensures total adherence to institutional size charts and material efficiency metrics.",
    requirements: [
      "Minimum 5 years of commercial tailoring or heavy apparel production experience",
      "Expertise in operating high-speed commercial straight sew & overlock machines",
      "Outstanding speed and pattern layout planning under tight production schedules",
      "Deep understanding of primary & secondary school uniform design standards"
    ]
  },
  {
    id: 'embroidery-op',
    title: "Computerized Embroidery Machine Operator",
    department: "Branding Unit",
    location: "Uhuru Market, Nairobi (On-site)",
    type: "Full-Time",
    salaryRange: "Ksh 30,000 - 40,000 / Month",
    datePosted: "2026-06-06",
    description: "Responsible for setting up, adjusting, and operating computerized multi-head embroidery machines. This role handles digital file importing, thread matching, centering uniform panels, and checking embroidery outcomes for high-volume institutional orders.",
    requirements: [
      "Prior experience operating multi-head commercial embroidery machines (e.g., Brother, Tajima)",
      "Familiarity with stitch digitization software (Wilcom or similar tools is highly preferred)",
      "Strict eye for logo embroidery density, thread tension, and framing precision",
      "Ability to handle 500+ daily badge run schedules smoothly"
    ]
  },
  {
    id: 'qc-inspector',
    title: "Uniform Quality & Finishing Inspector",
    department: "Quality Assurance",
    location: "Uhuru Market, Nairobi (On-site)",
    type: "Contract / Full-Time",
    salaryRange: "Ksh 25,000 - 32,000 / Month",
    datePosted: "2026-06-07",
    description: "Ensure every finished garment meets Naisiae Textiles' high-durability standards. You will inspect collar sizing, pocket stitching correctness, zipper reliability, button count, thread trimming, and prepare the products for bulk iron press and institutional bundling.",
    requirements: [
      "Previous quality control or final inspection experience on a busy production line",
      "Meticulous attention to detail (measuring tape checks, fabric defects spotting)",
      "Capable of sorting, iron pressing, and solid industrial bundling configurations",
      "Familiar with packing lists and wholesale invoice tallying"
    ]
  }
];

export default function CareersPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen, isCartOpen, isWishlistOpen, setIsQuoteModalOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(CAREER_VACANCIES[0]);
  const [appSubmitted, setAppSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    cvNote: ''
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setAppSubmitted(true);
    setTimeout(() => {
      setAppSubmitted(false);
      setFormData({ name: '', email: '', phone: '', experience: '', cvNote: '' });
    }, 6000);
  };

  return (
    <div id="careers-root-container" className="min-h-screen bg-[#0E121C] text-white flex flex-col font-sans">
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <Breadcrumb />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-36 pb-20 bg-gradient-to-b from-[#162032] to-[#0E121C] border-b border-white/5">
        <div className="absolute inset-0 bg-[#0E121C]/40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(199,16,46,0.15),transparent_80%)]"></div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <span className="text-[#C8961A] text-xs font-black uppercase tracking-[4px] bg-[#C8961A]/10 px-4 py-1.5 rounded-full inline-block mb-4 border border-[#C8961A]/20">
            Work with us
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-7xl uppercase font-display font-black tracking-tighter text-white mb-6">
            Join <span className="font-sans text-[#C8102E] font-medium tracking-normal lowercase italic">the Naisiae crew</span>
          </h1>
          <p className="max-w-2xl mx-auto text-white/70 text-base md:text-lg font-light leading-relaxed">
            Craft high-quality apparel alongside Nairobi's top material experts. We are empowering tailors, digital designers, and QC inspectors at our Uhuru Market production floor.
          </p>
        </div>
      </section>

      {/* Main Jobs Section */}
      <section className="py-20 max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1">
        
        {/* Left Column: Job Selector List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-white/5 bg-white/[0.01] rounded-3xl p-6 mb-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#C8961A] mb-2">Our Philosophy</h2>
            <p className="text-white/60 text-xs leading-relaxed font-light">
              Naisiae Textiles stands for absolute material integrity, fair compensation, and specialized skill matching. We cultivate a fast-paced but mutual-support workspace environment.
            </p>
          </div>

          <h3 className="text-sm font-black uppercase tracking-wider text-white px-2">Active Vacancies ({CAREER_VACANCIES.length})</h3>
          <div className="space-y-3">
            {CAREER_VACANCIES.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <button
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setAppSubmitted(false);
                  }}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                    isSelected 
                      ? 'border-[#C8102E] bg-white/[0.04] shadow-lg scale-[1.02]' 
                      : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C8102E]"></div>
                  )}
                  <p className="text-xs font-bold uppercase tracking-widest text-[#C8961A] mb-1.5">{job.department}</p>
                  <h4 className="text-sm md:text-base font-black uppercase tracking-wide text-white group-hover:text-[#C8102E] transition-colors mb-3">
                    {job.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-white/50 text-[11px] font-mono">
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-[#C8102E]" /> {job.location.split('(')[0]}</span>
                    <span className="flex items-center gap-1"><Clock size={12} className="text-[#C8961A]" /> {job.type}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Job Detail & Apply Form */}
        <div className="lg:col-span-7">
          {selectedJob ? (
            <div className="border border-white/5 bg-white/[0.02] rounded-[2.5rem] p-8 lg:p-12 space-y-8 shadow-2xl relative">
              <div className="border-b border-white/5 pb-8">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#C8961A] mb-2 inline-block">
                  {selectedJob.department} &bull; Posted on {selectedJob.datePosted}
                </span>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-4">
                  {selectedJob.title}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                    <Clock size={14} className="text-[#C8961A]" />
                    <div className="text-left">
                      <p className="text-[9px] uppercase text-white/40 tracking-wider">Commitment</p>
                      <p className="text-xs font-bold text-white">{selectedJob.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                    <DollarSign size={14} className="text-[#C8102E]" />
                    <div className="text-left">
                      <p className="text-[9px] uppercase text-white/40 tracking-wider">Salary</p>
                      <p className="text-xs font-bold text-white">Wholesale Pay</p>
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1 flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                    <MapPin size={14} className="text-[#C8961A]" />
                    <div className="text-left">
                      <p className="text-[9px] uppercase text-white/40 tracking-wider">Location</p>
                      <p className="text-xs font-bold text-white">Nairobi Workshop</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#C8961A]">Role Description</h4>
                <p className="text-white/70 text-sm md:text-base font-light leading-relaxed">{selectedJob.description}</p>
              </div>

              {/* Requirements List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#C8961A]">Operational Requirements</h4>
                <div className="space-y-3">
                  {selectedJob.requirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-[#C8102E] shrink-0 mt-0.5" />
                      <p className="text-white/80 text-sm font-light leading-relaxed">{req}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment Apply Form */}
              <div className="border-t border-white/5 pt-8 space-y-6">
                <div className="text-left">
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">Express Application</h4>
                  <p className="text-white/50 text-xs font-light mt-1">Submit your details to receive an invitation for an practical sewing trial.</p>
                </div>

                {appSubmitted ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-2">
                    <p className="text-emerald-400 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} /> Application Transmitted!
                    </p>
                    <p className="text-white/60 text-xs font-light">
                      Naisiae Sync system received your credentials. Our hiring manager will call you over the phone shortly to schedule an in-person sampling interview.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your Name"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C8102E]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Active Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="e.g. +254 792 021 795"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C8102E]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Email Address (Optional)</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="your-email@gmail.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C8102E]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Years of Sewing/QA Practice</label>
                        <input
                          type="text"
                          value={formData.experience}
                          onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                          placeholder="e.g. 3 years as industrial tailor"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C8102E]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Explain Special Machining/Skills (Optional)</label>
                      <textarea
                        rows={3}
                        value={formData.cvNote}
                        onChange={(e) => setFormData(prev => ({ ...prev, cvNote: e.target.value }))}
                        placeholder="Drafting, computerized blazers cutting, buttons assembly details..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#C8102E] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-[#C8102E] hover:bg-[#E94C36] active:scale-95 text-white/90 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      Process Uniforms Vacancy Entry <Send size={12} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center text-white/40 text-sm italic font-light border border-white/5 bg-white/[0.01] rounded-[2.5rem]">
              Select a vacancy from the panel to inspect active requirements and submit your application.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
