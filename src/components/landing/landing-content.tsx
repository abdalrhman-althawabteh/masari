"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DotGlobeHero } from "@/components/ui/globe-hero";
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
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function LandingContent() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#A3FF3C]">Masari</span>
            <span className="text-sm text-white/40">مصاري</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-[#A3FF3C] text-black px-4 py-2 rounded-lg hover:bg-[#8FE635] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with Globe */}
      <DotGlobeHero
        rotationSpeed={0.003}
        globeRadius={1.3}
        className="bg-[#0a0a0a]"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/50 z-[1]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#A3FF3C]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-[#A3FF3C]/3 rounded-full blur-[100px] animate-pulse" />

        <div className="relative z-10 text-center space-y-8 max-w-5xl mx-auto px-4 sm:px-6 pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#A3FF3C]/5 border border-[#A3FF3C]/20 backdrop-blur-xl"
          >
            <div className="w-1.5 h-1.5 bg-[#A3FF3C] rounded-full animate-ping" />
            <span className="text-xs font-semibold text-[#A3FF3C] tracking-wider uppercase">
              AI-Powered Finance
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight"
          >
            <span className="block text-white/70 font-light text-3xl sm:text-4xl lg:text-5xl mb-2">
              Your money,
            </span>
            <span className="relative">
              <span className="bg-gradient-to-r from-[#A3FF3C] via-[#A3FF3C] to-[#6FCF17] bg-clip-text text-transparent">
                under control.
              </span>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, delay: 1.2, ease: "easeOut" }}
                className="absolute -bottom-3 left-0 h-1 bg-gradient-to-r from-[#A3FF3C] via-[#A3FF3C]/60 to-transparent rounded-full"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed"
          >
            Track income, expenses, subscriptions, debts, and savings — all in one place.
            AI categorizes your spending. Telegram bot logs on the go.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#A3FF3C] text-black font-semibold px-8 py-3.5 rounded-xl hover:bg-[#8FE635] transition-all text-base shadow-xl shadow-[#A3FF3C]/10"
              >
                Start for Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-white/10 text-white/70 font-medium px-8 py-3.5 rounded-xl hover:bg-white/5 hover:text-white transition-all text-base backdrop-blur-xl"
              >
                I have an account
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </DotGlobeHero>

      {/* Full App Preview */}
      <section className="relative -mt-32 z-20 px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <div className="rounded-2xl border border-white/10 bg-[#111] p-1.5 shadow-2xl shadow-black/50">
            <div className="rounded-xl bg-[#0f0f0f] overflow-hidden">
              {/* Browser dots */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                <div className="ml-4 flex-1 h-5 rounded bg-white/5 max-w-xs" />
              </div>

              <div className="flex min-h-[420px] sm:min-h-[480px]">
                {/* Sidebar */}
                <div className="hidden sm:flex flex-col w-52 border-r border-white/5 bg-[#111] p-4">
                  <div className="flex items-center gap-2 mb-8">
                    <span className="text-sm font-bold text-[#A3FF3C]">Masari</span>
                    <span className="text-[10px] text-white/30">مصاري</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { icon: LayoutDashboard, label: "Dashboard", active: true },
                      { icon: ArrowLeftRight, label: "Transactions", active: false },
                      { icon: CalendarDays, label: "Subscriptions", active: false },
                      { icon: Target, label: "Budgets", active: false },
                      { icon: PiggyBank, label: "Savings", active: false },
                      { icon: Handshake, label: "Debts", active: false },
                      { icon: Tags, label: "Categories", active: false },
                      { icon: Settings, label: "Settings", active: false },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                          item.active
                            ? "bg-[#A3FF3C]/10 text-[#A3FF3C]"
                            : "text-white/30"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-4 sm:p-6 space-y-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: "Income", value: "$4,250", icon: TrendingUp, color: "#A3FF3C" },
                      { label: "Expenses", value: "$2,847", icon: TrendingDown, color: "#FF4444" },
                      { label: "Balance", value: "$1,403", icon: Wallet, color: "#A3FF3C" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-xl bg-[#1a1a1a] border border-white/5 p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] sm:text-[10px] text-white/40">{card.label}</p>
                          <card.icon className="h-3 w-3" style={{ color: card.color }} />
                        </div>
                        <p className="text-xs sm:text-lg font-bold mt-1" style={{ color: card.color }}>
                          {card.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chart area */}
                  <div className="rounded-xl bg-[#1a1a1a] border border-white/5 p-4">
                    <p className="text-[10px] text-white/40 mb-3">Income vs Expenses</p>
                    <div className="flex items-end gap-1.5 sm:gap-2 h-28 sm:h-36">
                      {[
                        { h1: 35, h2: 25 }, { h1: 50, h2: 40 }, { h1: 40, h2: 55 },
                        { h1: 65, h2: 45 }, { h1: 55, h2: 35 }, { h1: 70, h2: 50 },
                        { h1: 60, h2: 40 }, { h1: 80, h2: 55 }, { h1: 75, h2: 45 },
                        { h1: 90, h2: 60 }, { h1: 85, h2: 50 }, { h1: 95, h2: 55 },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex gap-0.5">
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${bar.h1}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.8 + i * 0.05 }}
                            className="flex-1 rounded-t-sm bg-gradient-to-t from-[#A3FF3C]/30 to-[#A3FF3C]/60"
                          />
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${bar.h2}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.9 + i * 0.05 }}
                            className="flex-1 rounded-t-sm bg-gradient-to-t from-[#FF4444]/20 to-[#FF4444]/50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Recent transactions */}
                    <div className="rounded-xl bg-[#1a1a1a] border border-white/5 p-3 sm:p-4">
                      <p className="text-[10px] text-white/40 mb-2">Recent</p>
                      {[
                        { name: "Uber", amount: "-$8.50", color: "#FF4444" },
                        { name: "Freelance", amount: "+$500", color: "#A3FF3C" },
                        { name: "Netflix", amount: "-$15.99", color: "#FF4444" },
                      ].map((tx) => (
                        <div key={tx.name} className="flex items-center justify-between py-1.5">
                          <span className="text-[10px] sm:text-xs text-white/50">{tx.name}</span>
                          <span className="text-[10px] sm:text-xs font-medium" style={{ color: tx.color }}>
                            {tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* AI widget */}
                    <div className="rounded-xl bg-[#1a1a1a] border border-[#A3FF3C]/10 p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="h-3 w-3 text-[#A3FF3C]" />
                        <p className="text-[10px] text-[#A3FF3C]">Can I Spend?</p>
                      </div>
                      <div className="rounded-lg bg-[#A3FF3C]/5 border border-[#A3FF3C]/10 p-2 sm:p-2.5">
                        <p className="text-[9px] sm:text-[10px] text-white/50 leading-relaxed">
                          &quot;You have room for this purchase. Budget is at 62% with $380 remaining.&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
            >
              Everything you need
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-white/40 max-w-xl mx-auto text-lg">
              Built for people who want to understand where their money goes.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[
              { icon: CreditCard, title: "Transaction Tracking", desc: "Log income and expenses with dual currency (USD & JOD). Filter, search, edit anytime.", highlight: false },
              { icon: Brain, title: "AI Categorization", desc: "Type a description — AI suggests the category. It learns from your corrections over time.", highlight: true },
              { icon: CalendarDays, title: "Subscription Manager", desc: "Track recurring payments, upcoming renewals, auto-log expenses when they renew.", highlight: false },
              { icon: Target, title: "Budgets & Limits", desc: "Set monthly budgets — total or per category. Warnings when approaching limits.", highlight: false },
              { icon: Bot, title: "Telegram Bot", desc: 'Message "Spent 15 JOD on lunch" — logged instantly. Send receipt photos for AI scanning.', highlight: true },
              { icon: PiggyBank, title: "Savings Goals", desc: "Set targets, track contributions, see projected completion dates.", highlight: false },
              { icon: Handshake, title: "Debt Tracker", desc: "Track who owes who. Mark as paid — auto-creates a transaction.", highlight: false },
              { icon: BarChart3, title: "Smart Reports", desc: "Weekly and monthly email reports with trends and AI financial advice.", highlight: false },
              { icon: Sparkles, title: '"Can I Spend This?"', desc: "Ask AI if you can afford a purchase. It checks budget, bills, and income.", highlight: true },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4, borderColor: f.highlight ? "rgba(163,255,60,0.3)" : "rgba(255,255,255,0.1)" }}
                className={`rounded-2xl border p-6 transition-all ${
                  f.highlight
                    ? "border-[#A3FF3C]/15 bg-[#A3FF3C]/[0.02]"
                    : "border-white/5 bg-white/[0.01]"
                }`}
              >
                <div className={`inline-flex p-2.5 rounded-xl mb-4 ${
                  f.highlight ? "bg-[#A3FF3C]/10 text-[#A3FF3C]" : "bg-white/5 text-white/50"
                }`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-white font-semibold">{f.title}</h3>
                <p className="text-white/40 text-sm mt-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold text-white">
              Simple to start
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8"
          >
            {[
              { n: "01", t: "Create your account", d: "Sign up with email or Google. Set your preferred currency." },
              { n: "02", t: "Log your transactions", d: "Add income and expenses from the app or via Telegram." },
              { n: "03", t: "Let AI do the rest", d: "Auto-categorization, budgets, reports, and insights." },
            ].map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} custom={i} className="text-center">
                <div className="text-5xl font-bold text-[#A3FF3C]/15 mb-3">{s.n}</div>
                <h3 className="text-white font-semibold">{s.t}</h3>
                <p className="text-white/40 text-sm mt-2">{s.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
        >
          {[
            { icon: Shield, t: "Privacy First", d: "No bank connections. Your data stays yours." },
            { icon: Zap, t: "Multi-Provider AI", d: "OpenAI, Anthropic, or Gemini. Your choice." },
            { icon: Smartphone, t: "Works Everywhere", d: "Web app + Telegram bot for on-the-go logging." },
          ].map((item, i) => (
            <motion.div key={item.t} variants={fadeUp} custom={i} className="p-6">
              <item.icon className="h-8 w-8 text-[#A3FF3C] mx-auto mb-3" />
              <h3 className="text-white font-semibold">{item.t}</h3>
              <p className="text-white/40 text-sm mt-2">{item.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#A3FF3C]/5 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            Start managing your
            <br />
            <span className="text-[#A3FF3C]">money today</span>
          </h2>
          <p className="mt-4 text-white/40 text-lg">
            Free to use. No credit card required.
          </p>
          <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} className="mt-8 inline-block">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#A3FF3C] text-black font-semibold px-10 py-4 rounded-xl hover:bg-[#8FE635] transition-all text-lg shadow-xl shadow-[#A3FF3C]/20"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#A3FF3C]">Masari</span>
            <span className="text-xs text-white/30">مصاري</span>
          </div>
          <p className="text-xs text-white/30">Your AI-powered personal accountant</p>
        </div>
      </footer>
    </div>
  );
}
