// Classic scripts also work when the navigation page is opened using file://.
(() => {
  const status = document.getElementById('loading');
  let finished = false;
  const timer = setTimeout(() => {
    if (!finished) status.textContent = '読み込みに時間がかかっています。フォルダー全体がこの端末に保存されているか確認してください。';
  }, 30000);
  window.robotAtlasBootComplete = () => { finished = true; clearTimeout(timer); };
  window.robotAtlasBootError = error => {
    window.robotAtlasBootComplete();
    status.hidden = false;
    status.textContent = 'モデルを読み込めません：' + (error?.message || error) + '。フォルダー全体を保存して再読み込みするか、「プレビューを起動.command」から開いてください。';
  };
  const script = document.createElement('script');
  script.src = 'app.bundle.js?v=v003-portable1';
  script.onerror = () => window.robotAtlasBootError('app.bundle.js');
  window.addEventListener('error', event => { if (!finished) window.robotAtlasBootError(event.error || event.message); });
  window.addEventListener('unhandledrejection', event => { if (!finished) window.robotAtlasBootError(event.reason); });
  document.head.append(script);
})();
