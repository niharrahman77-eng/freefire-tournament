// pages/download.js
export default function Download() {
  return (
    <div className="max-w-md mx-auto text-center">

      {/* Header */}
      <div className="card mb-6 py-8">
        <div className="w-24 h-24 bg-ff-orange rounded-2xl flex items-center justify-center text-5xl mx-auto mb-4 border-4 border-orange-400 shadow-[0_0_30px_rgba(255,107,0,0.5)]">
          🔥
        </div>
        <h1 className="font-game font-bold text-3xl text-white mb-2">ClashSphere</h1>
        <p className="text-gray-400 text-sm">Free Fire Tournament Platform</p>
        <p className="text-gray-500 text-xs mt-1">Version 1.0.0</p>
      </div>

      {/* Download Button */}
      <div className="card mb-4">
        <h2 className="font-game font-bold text-lg mb-2">📱 Android App</h2>
        <p className="text-gray-400 text-sm mb-4">
          Download and install the ClashSphere app directly on your Android phone
        </p>
        <a
          href="/ClashSphere.apk"
          download="ClashSphere.apk"
          className="btn-primary w-full block text-center text-lg py-4">
          ⬇️ Download App (APK)
        </a>
        <p className="text-gray-500 text-xs mt-2">Free · Android 5.0+</p>
      </div>

      {/* How to Install */}
      <div className="card mb-4 text-left">
        <h2 className="font-game font-bold text-lg mb-4 text-center">
          📖 How to Install
        </h2>
        <div className="flex flex-col gap-4">
          {[
            { step: '1', icon: '⬇️', title: 'Download APK', desc: 'Tap the Download button above' },
            { step: '2', icon: '📂', title: 'Open File', desc: 'Open the downloaded APK file from your notifications or Downloads folder' },
            { step: '3', icon: '⚙️', title: 'Allow Installation', desc: 'If asked, tap "Allow from this source" or "Install unknown apps"' },
            { step: '4', icon: '✅', title: 'Install', desc: 'Tap Install and wait a few seconds' },
            { step: '5', icon: '🔥', title: 'Open App', desc: 'Find ClashSphere on your home screen and start playing!' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-ff-orange rounded-full flex items-center justify-center font-game font-bold text-white text-sm shrink-0 border-2 border-orange-400">
                {item.step}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{item.icon} {item.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="card border border-yellow-800 bg-yellow-900/10 text-left mb-4">
        <h3 className="font-game font-bold text-yellow-400 mb-2">⚠️ Important Note</h3>
        <p className="text-gray-400 text-xs leading-relaxed">
          Since this app is not from Google Play Store, Android will show a security warning.
          This is normal! Just tap <span className="text-white font-bold">"Install Anyway"</span> or{' '}
          <span className="text-white font-bold">"Allow from this source"</span> to continue.
          The app is completely safe.
        </p>
      </div>

      {/* Features */}
      <div className="card text-left">
        <h2 className="font-game font-bold text-lg mb-4 text-center">🏆 App Features</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            '🏆 Join Tournaments',
            '💰 Win Real Money',
            '👥 Solo Duo Squad',
            '💳 UPI Deposit',
            '📱 Mobile Friendly',
            '⚡ Fast & Smooth',
            '🏅 Live Results',
            '💸 Easy Withdrawal',
          ].map(f => (
            <div key={f} className="bg-ff-dark rounded p-2 text-xs text-gray-300">{f}</div>
          ))}
        </div>
      </div>

    </div>
  );
}
