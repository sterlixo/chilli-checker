window.addEventListener('DOMContentLoaded', function() {
  if (!localStorage.getItem('privacyAccepted')) {
    var banner = document.createElement('div');
    banner.id = 'privacy-banner';
    banner.style = 'position:fixed;bottom:0;left:0;width:100%;background:#222;color:#fff;padding:16px;z-index:9999;text-align:center;';
    banner.innerHTML = 'This site uses cookies and third-party analytics (Microsoft Clarity) for usage statistics. <button id="accept-privacy" style="margin-left:16px;">Accept</button>';
    document.body.appendChild(banner);
    document.getElementById('accept-privacy').addEventListener('click', function() {
      localStorage.setItem('privacyAccepted', '1');
      document.getElementById('privacy-banner').remove();
    });
  }
});
