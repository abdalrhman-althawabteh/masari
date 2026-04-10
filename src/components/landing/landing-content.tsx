"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CalendarDays,
  CreditCard,
  Handshake,
  PiggyBank,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  Zap,
  ArrowLeftRight,
  Tags,
  Settings,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  GraduationCap,
  Briefcase,
  Heart,
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function LandingContent() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ============ NAV ============ */}
      <nav className="fixed top-0 w-full z-50 bg-[#FFFDF5]/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
              <span className="text-[#A3FF3C] font-black text-sm">M</span>
            </div>
            <span className="text-lg font-bold text-[#1a1a1a] tracking-tight">Masari</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors px-4 py-2 font-medium">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-semibold bg-[#1a1a1a] text-white px-5 py-2.5 rounded-full hover:bg-[#333] transition-all">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO — Cream ============ */}
      <section className="relative bg-[#FFFDF5] pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A3FF3C]/20 text-[#2d7a00] text-sm font-semibold mb-8">
              <Sparkles className="h-3.5 w-3.5" /> AI-Powered Finance
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#1a1a1a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Don&apos;t guess,
            <br />
            <span className="italic text-[#2d7a00]">just track.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-lg sm:text-xl text-[#1a1a1a]/50 max-w-xl mx-auto leading-relaxed"
          >
            The personal finance app that turns chaos into clarity. AI categorizes. Telegram logs on the go. You stay in control.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/signup" className="group inline-flex items-center gap-2 bg-[#1a1a1a] text-white font-semibold px-8 py-3.5 rounded-full hover:bg-[#333] transition-all text-base">
              Start for free <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="#features" className="inline-flex items-center gap-1 text-[#1a1a1a]/50 hover:text-[#1a1a1a] font-medium px-5 py-3.5 text-base transition-colors">
              See what&apos;s inside
            </Link>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="mt-16 overflow-hidden border-y border-black/[0.04] py-4 bg-[#FFFDF5]">
          <div className="flex animate-marquee whitespace-nowrap gap-10 text-[#1a1a1a]/20 text-sm font-semibold tracking-wide">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="flex items-center gap-10">
                <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> TRANSACTIONS</span>
                <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> SUBSCRIPTIONS</span>
                <span className="flex items-center gap-2"><Target className="h-4 w-4" /> BUDGETS</span>
                <span className="flex items-center gap-2"><PiggyBank className="h-4 w-4" /> SAVINGS</span>
                <span className="flex items-center gap-2"><Handshake className="h-4 w-4" /> DEBTS</span>
                <span className="flex items-center gap-2"><Brain className="h-4 w-4" /> AI</span>
                <span className="flex items-center gap-2"><Bot className="h-4 w-4" /> TELEGRAM</span>
                <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> REPORTS</span>
              </span>
            ))}
          </div>
        </div>

        {/* Curved divider */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 60L1440 60V30C1200 0 240 0 0 30V60Z" fill="white" />
        </svg>
      </section>

      {/* ============ APP PREVIEW — White ============ */}
      <section className="bg-white py-16 sm:py-24 px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <div className="rounded-[28px] border-2 border-[#eee] bg-[#fafafa] p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
            <div className="rounded-[22px] bg-[#0f0f0f] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                <div className="ml-4 h-6 rounded-full bg-white/5 flex-1 max-w-xs flex items-center px-3">
                  <span className="text-[10px] text-white/20">masari.app/dashboard</span>
                </div>
              </div>

              <div className="flex min-h-[400px]">
                <div className="hidden sm:flex flex-col w-48 border-r border-white/5 bg-[#0a0a0a] p-3">
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="w-5 h-5 rounded bg-[#A3FF3C] flex items-center justify-center">
                      <span className="text-black font-black text-[7px]">M</span>
                    </div>
                    <span className="text-[11px] font-semibold text-white">Masari</span>
                  </div>
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: ArrowLeftRight, label: "Transactions" },
                    { icon: CalendarDays, label: "Subscriptions" },
                    { icon: Target, label: "Budgets" },
                    { icon: PiggyBank, label: "Savings" },
                    { icon: Handshake, label: "Debts" },
                    { icon: Tags, label: "Categories" },
                    { icon: Settings, label: "Settings" },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] mb-0.5 ${item.active ? "bg-[#A3FF3C]/10 text-[#A3FF3C]" : "text-white/20"}`}>
                      <item.icon className="h-3 w-3" />{item.label}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 sm:p-5 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Income", v: "$4,250", icon: TrendingUp, c: "#A3FF3C" },
                      { l: "Expenses", v: "$2,847", icon: TrendingDown, c: "#FF4444" },
                      { l: "Balance", v: "$1,403", icon: Wallet, c: "#A3FF3C" },
                    ].map((card) => (
                      <div key={card.l} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-white/30">{card.l}</span>
                          <card.icon className="h-3 w-3" style={{ color: card.c }} />
                        </div>
                        <p className="text-xs sm:text-base font-bold mt-1" style={{ color: card.c }}>{card.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] text-white/30">Income vs Expenses</p>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-2 h-2 rounded-full bg-[#A3FF3C]/60" />Income</span>
                        <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-2 h-2 rounded-full bg-[#FF4444]/60" />Expenses</span>
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <svg viewBox="0 0 500 120" className="w-full h-28 sm:h-36" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A3FF3C" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#A3FF3C" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF4444" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#FF4444" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Income area */}
                        <motion.path
                          d="M0,90 C40,85 60,70 100,60 C140,50 160,35 200,30 C240,25 260,40 300,35 C340,30 360,20 400,15 C440,10 480,18 500,12 L500,120 L0,120 Z"
                          fill="url(#incomeGrad)"
                          initial={{ opacity: 0, pathLength: 0 }}
                          whileInView={{ opacity: 1, pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                        <motion.path
                          d="M0,90 C40,85 60,70 100,60 C140,50 160,35 200,30 C240,25 260,40 300,35 C340,30 360,20 400,15 C440,10 480,18 500,12"
                          fill="none"
                          stroke="#A3FF3C"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                        {/* Expense area */}
                        <motion.path
                          d="M0,95 C40,92 60,85 100,80 C140,75 160,65 200,70 C240,75 260,60 300,65 C340,70 360,55 400,50 C440,45 480,52 500,48 L500,120 L0,120 Z"
                          fill="url(#expenseGrad)"
                          initial={{ opacity: 0, pathLength: 0 }}
                          whileInView={{ opacity: 1, pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.7 }}
                        />
                        <motion.path
                          d="M0,95 C40,92 60,85 100,80 C140,75 160,65 200,70 C240,75 260,60 300,65 C340,70 360,55 400,50 C440,45 480,52 500,48"
                          fill="none"
                          stroke="#FF4444"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.7 }}
                        />
                        {/* Dots on income line */}
                        {[
                          [0, 90], [100, 60], [200, 30], [300, 35], [400, 15], [500, 12],
                        ].map(([cx, cy], i) => (
                          <motion.circle
                            key={`inc-${i}`}
                            cx={cx}
                            cy={cy}
                            r="3"
                            fill="#A3FF3C"
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 1 + i * 0.1 }}
                          />
                        ))}
                        {/* Dots on expense line */}
                        {[
                          [0, 95], [100, 80], [200, 70], [300, 65], [400, 50], [500, 48],
                        ].map(([cx, cy], i) => (
                          <motion.circle
                            key={`exp-${i}`}
                            cx={cx}
                            cy={cy}
                            r="3"
                            fill="#FF4444"
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 1.2 + i * 0.1 }}
                          />
                        ))}
                      </svg>
                    </motion.div>
                    {/* Month labels */}
                    <div className="flex justify-between mt-1 px-1">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                        <span key={m} className="text-[8px] text-white/20">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ USE CASES — Soft Green ============ */}
      <section className="bg-[#F0F9E8] py-24 sm:py-32 px-5 sm:px-8 relative">
        <svg className="absolute top-0 left-0 w-full -translate-y-[1px]" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 0L1440 0V30C1200 60 240 60 0 30V0Z" fill="white" />
        </svg>

        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeIn} custom={0} className="text-[#2d7a00] text-sm font-bold mb-3 tracking-wider uppercase">Who it&apos;s for</motion.p>
            <motion.h2 variants={fadeIn} custom={1} className="text-3xl sm:text-5xl font-bold text-[#1a1a1a] tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
              Built for <span className="italic text-[#2d7a00]">real people</span>
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Briefcase, title: "Freelancers", desc: "Track client income, project expenses, and invoices in one place.", color: "#FF8A00" },
              { icon: Heart, title: "Families", desc: "Shared budgets, track household expenses, plan savings together.", color: "#FF4444" },
              { icon: GraduationCap, title: "Students", desc: "Stay on budget with limited income. Track every dinar and dollar.", color: "#3B82F6" },
              { icon: Users, title: "Small Teams", desc: "Track business subscriptions, team expenses, and monthly budgets.", color: "#8B5CF6" },
            ].map((uc, i) => (
              <motion.div
                key={uc.title}
                variants={fadeIn}
                custom={i}
                className="bg-white rounded-3xl p-7 border border-black/[0.04] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${uc.color}15` }}>
                  <uc.icon className="h-6 w-6" style={{ color: uc.color }} />
                </div>
                <h3 className="font-bold text-lg text-[#1a1a1a]">{uc.title}</h3>
                <p className="text-[#1a1a1a]/50 text-sm mt-2 leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ FEATURES — Dark ============ */}
      <section id="features" className="bg-[#0f0f0f] py-24 sm:py-32 px-5 sm:px-8 relative">
        <svg className="absolute top-0 left-0 w-full -translate-y-[1px]" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 0L1440 0V30C1200 60 240 60 0 30V0Z" fill="#F0F9E8" />
        </svg>

        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeIn} custom={0} className="text-[#A3FF3C] text-sm font-bold mb-3 tracking-wider uppercase">Features</motion.p>
            <motion.h2 variants={fadeIn} custom={1} className="text-3xl sm:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
              Everything you need,
              <br /><span className="italic text-white/30">nothing you don&apos;t.</span>
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: CreditCard, title: "Transactions", desc: "Log income & expenses in USD or JOD.", bg: "#1a1a1a", accent: "#A3FF3C" },
              { icon: Brain, title: "AI Categorization", desc: "AI suggests categories. Learns from you.", bg: "#1c2a10", accent: "#A3FF3C" },
              { icon: CalendarDays, title: "Subscriptions", desc: "Track recurring payments. Auto-log renewals.", bg: "#1a1a1a", accent: "#FF8A00" },
              { icon: Target, title: "Budgets", desc: "Monthly limits with visual progress bars.", bg: "#1a1a1a", accent: "#3B82F6" },
              { icon: Bot, title: "Telegram Bot", desc: "Message to log. Send receipts for scanning.", bg: "#1a1a20", accent: "#8B5CF6" },
              { icon: PiggyBank, title: "Savings Goals", desc: "Set targets. Track contributions. AI projects.", bg: "#1a1a1a", accent: "#A3FF3C" },
              { icon: Handshake, title: "Debts", desc: "Track who owes who. Mark paid → auto-transaction.", bg: "#1a1a1a", accent: "#FF4444" },
              { icon: BarChart3, title: "Email Reports", desc: "Weekly & monthly with AI financial advice.", bg: "#1a1a1a", accent: "#FF8A00" },
              { icon: Sparkles, title: "\"Can I Spend?\"", desc: "Ask AI — it checks budget, bills, income.", bg: "#1c2a10", accent: "#A3FF3C" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeIn}
                custom={i}
                className="rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                style={{ background: f.bg }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.accent}15` }}>
                  <f.icon className="h-5 w-5" style={{ color: f.accent }} />
                </div>
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="text-white/35 text-sm mt-1.5 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ HOW IT WORKS — Cream ============ */}
      <section className="bg-[#FFFDF5] py-24 sm:py-32 px-5 sm:px-8 relative">
        <svg className="absolute top-0 left-0 w-full -translate-y-[1px]" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 0L1440 0V30C1200 60 240 60 0 30V0Z" fill="#0f0f0f" />
        </svg>

        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeIn} custom={0} className="text-[#2d7a00] text-sm font-bold mb-3 tracking-wider uppercase">How it works</motion.p>
            <motion.h2 variants={fadeIn} custom={1} className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
              Ready in <span className="italic text-[#2d7a00]">60 seconds</span>
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: "01", icon: CreditCard, t: "Create your account", d: "Sign up with email or Google. Pick your preferred currency (USD or JOD).", color: "#2d7a00" },
              { n: "02", icon: ArrowLeftRight, t: "Log your money", d: "Add transactions from the app — or just send a message to your Telegram bot.", color: "#FF8A00" },
              { n: "03", icon: Sparkles, t: "AI does the rest", d: "Auto-categorization, smart budgets, weekly reports, and personalized financial advice.", color: "#3B82F6" },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                variants={fadeIn}
                custom={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const, delay: i * 0.5 }}
                className="bg-white rounded-3xl p-8 border border-black/[0.04] shadow-sm text-center"
              >
                <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `${step.color}10` }}>
                  <step.icon className="h-7 w-7" style={{ color: step.color }} />
                </div>
                <span className="text-[#2d7a00]/30 text-xs font-mono font-bold">{step.n}</span>
                <h3 className="font-bold text-xl text-[#1a1a1a] mt-2">{step.t}</h3>
                <p className="text-[#1a1a1a]/45 text-base mt-3 leading-relaxed">{step.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ TELEGRAM — Black ============ */}
      <section className="bg-[#0a0a0a] py-24 sm:py-32 px-5 sm:px-8 relative">
        <svg className="absolute top-0 left-0 w-full -translate-y-[1px]" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 0L1440 0V30C1200 60 240 60 0 30V0Z" fill="#FFFDF5" />
        </svg>

        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <Bot className="h-12 w-12 text-[#A3FF3C]/70 mb-6 mx-auto lg:mx-0" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
              Log expenses
              <br /><span className="italic text-[#A3FF3C]">from Telegram.</span>
            </h2>
            <p className="mt-4 text-white/60 text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
              Just message your bot. &quot;Spent 15 JOD on lunch&quot; — done. Send a receipt photo — AI scans it. Ask &quot;what&apos;s my balance?&quot; — instant answer.
            </p>
          </div>
          <div className="flex-1 max-w-sm w-full">
            <div className="bg-[#1a1a1a] rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#A3FF3C]/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-[#A3FF3C]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Masari Bot</p>
                  <p className="text-white/40 text-xs">online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-[#A3FF3C] text-black text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[220px] font-medium">
                    Spent 15 JOD on lunch
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white text-sm px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[250px]">
                    ✅ <strong>Expense logged!</strong><br />
                    💸 -15.00 JOD<br />
                    📝 Lunch<br />
                    📁 Food & Dining
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#A3FF3C] text-black text-sm px-4 py-2.5 rounded-2xl rounded-br-md font-medium">
                    What&apos;s my balance?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white text-sm px-4 py-2.5 rounded-2xl rounded-bl-md">
                    📊 <strong>This month:</strong><br />
                    💰 Income: $4,250<br />
                    💸 Expenses: $2,862<br />
                    ✅ Balance: $1,388
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST — White ============ */}
      <section className="bg-white py-24 sm:py-28 px-5 sm:px-8 relative">
        <svg className="absolute top-0 left-0 w-full -translate-y-[1px]" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 0L1440 0V30C1200 60 240 60 0 30V0Z" fill="#0a0a0a" />
        </svg>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: Shield, title: "Privacy First", desc: "No bank connections. You control everything that goes in.", color: "#2d7a00" },
            { icon: Zap, title: "Your AI Choice", desc: "Works with OpenAI, Anthropic, or Gemini. Bring your key.", color: "#FF8A00" },
            { icon: Smartphone, title: "Works Everywhere", desc: "Web dashboard on any device. Telegram bot for quick logging.", color: "#3B82F6" },
          ].map((item, i) => (
            <motion.div key={item.title} variants={fadeIn} custom={i} className="p-8">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `${item.color}10` }}>
                <item.icon className="h-7 w-7" style={{ color: item.color }} />
              </div>
              <h3 className="font-bold text-lg text-[#1a1a1a]">{item.title}</h3>
              <p className="text-[#1a1a1a]/40 text-sm mt-2 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ============ CTA — Dark ============ */}
      <section className="bg-[#0f0f0f] py-28 sm:py-36 px-5 sm:px-8 relative text-center">
        <svg className="absolute top-0 left-0 w-full -translate-y-[1px]" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 0L1440 0V30C1200 60 240 60 0 30V0Z" fill="white" />
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#A3FF3C]/[0.05] rounded-full blur-[120px]" />

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
            Start tracking your
            <br /><span className="italic text-[#A3FF3C]">money today.</span>
          </h2>
          <p className="mt-5 text-white/30 text-lg">Free. No credit card. 60 seconds to set up.</p>
          <div className="mt-10">
            <Link href="/signup" className="group inline-flex items-center gap-2 bg-[#A3FF3C] text-black font-semibold px-9 py-4 rounded-full hover:bg-[#b4ff5e] transition-all text-lg shadow-[0_0_50px_-12px_rgba(163,255,60,0.4)]">
              Get started free <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-[#0f0f0f] py-10 px-5 sm:px-8 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#A3FF3C] flex items-center justify-center">
              <span className="text-black font-black text-[8px]">M</span>
            </div>
            <span className="text-sm font-medium text-white">Masari</span>
            <span className="text-xs text-white/20">مصاري</span>
          </div>
          <p className="text-xs text-white/20">Your AI-powered personal accountant</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
      `}</style>
    </div>
  );
}
