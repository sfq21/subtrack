import { Bell, Check, Plus, Sparkles } from 'lucide-react'

export default function Hero({ onOpenAuth }) {
  return (
    <main className="landing">
      <section className="landing-copy">
        <div className="eyebrow"><Sparkles size={14} /> A little more clarity, every month</div>
        <h1>Your subscriptions,<br /><span>under control.</span></h1>
        <p className="landing-description">
          Keep all your recurring expenses in one calm, clear place. Know what is coming up before it catches you by surprise.
        </p>
        <button className="button button-primary landing-cta" type="button" onClick={onOpenAuth}>
          Get started <Plus size={17} />
        </button>
        <div className="landing-footnote"><Check size={15} /> Free to use · Your data stays yours</div>
      </section>
      <div className="landing-art" aria-hidden="true">
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="art-card art-card-back"><div className="fake-dot" /><div className="fake-lines"><i /><i /></div></div>
        <div className="art-card art-card-main">
          <div className="art-card-heading"><span>THIS MONTH</span><span className="art-menu">•••</span></div>
          <strong>4 subscriptions</strong>
          <div className="fake-progress"><i /></div>
          <div className="art-card-footer"><span>Renewal coming up</span><b>in 3 days</b></div>
        </div>
        <div className="art-floating"><Bell size={17} /><span><b>Heads up!</b><small>Renewal just around the corner</small></span></div>
        <span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✳</span>
      </div>
    </main>
  )
}
