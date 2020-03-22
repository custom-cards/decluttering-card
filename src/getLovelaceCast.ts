// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getLovelaceCast(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
