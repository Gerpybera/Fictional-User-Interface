export default class ToggleButtons {
  constructor(context) {
    this.ctx = context;
  }
  setup() {
    this.update();
  }
  update() {
    requestAnimationFrame(this.update.bind(this));
  }
}
