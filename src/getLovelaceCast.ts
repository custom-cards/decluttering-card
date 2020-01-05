export default function getLovelaceCast() {
  let root: any = document.querySelector('hc-main');
  root = root && root.shadowRoot;
  root = root && root.querySelector('hc-lovelace');
  root = root && root.shadowRoot;
  root = root && root.querySelector('hui-view');
  if (root) {
    const ll = root.lovelace;
    ll.current_view = root.___curView;
    return ll;
  }
  return null;
}
