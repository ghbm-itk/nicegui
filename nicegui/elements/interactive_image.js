export default {
  template: `
    <div :style="{ position: 'relative', aspectRatio: size ? size[0] / size[1] : undefined }">
      <img
        ref="img"
        :src="computed_src"
        :style="{ width: '100%', height: '100%', opacity: src ? 1 : 0 }"
        @load="onImageLoaded"
        v-on="onCrossEvents"
        v-on="onUserEvents"
        draggable="false"
      />
      <svg style="position:absolute;top:0;left:0;pointer-events:none" :viewBox="viewBox">
        <g v-if="cross" :style="{ display: showCross ? 'block' : 'none' }">
          <line :x1="x" y1="0" :x2="x" y2="100%" stroke="black" />
          <line x1="0" :y1="y" x2="100%" :y2="y" stroke="black" />
        </g>
        <g v-html="content"></g>
      </svg>
      <slot></slot>
    </div>
  `,
  data() {
    return {
      viewBox: "0 0 0 0",
      x: 100,
      y: 100,
      showCross: false,
      computed_src: undefined,
      waiting_source: undefined,
      loading: false,
    };
  },
  mounted() {
    setTimeout(() => this.compute_src(), 0); // NOTE: wait for window.path_prefix to be set in app.mounted()
    const handle_completion = () => {
      if (this.waiting_source) {
        this.computed_src = this.waiting_source;
        this.waiting_source = undefined;
      } else {
        this.loading = false;
      }
    };
    this.$refs.img.addEventListener("load", handle_completion);
    this.$refs.img.addEventListener("error", handle_completion);
  },
  updated() {
    this.compute_src();
  },
  methods: {
    compute_src() {
      const suffix = this.t ? (this.src.includes("?") ? "&" : "?") + "_nicegui_t=" + this.t : "";
      const new_src = (this.src.startsWith("/") ? window.path_prefix : "") + this.src + suffix;
      if (new_src == this.computed_src) {
        return;
      }
      if (this.loading) {
        this.waiting_source = new_src;
      } else {
        this.computed_src = new_src;
        this.loading = true;
      }
      if (!this.src && this.size) {
        this.viewBox = `0 0 ${this.size[0]} ${this.size[1]}`;
      }
    },
    updateCrossHair(e) {
      const width = this.src ? e.target.naturalWidth : this.size ? this.size[0] : 1;
      const height = this.src ? e.target.naturalHeight : this.size ? this.size[1] : 1;
      this.x = (e.offsetX * width) / e.target.clientWidth;
      this.y = (e.offsetY * height) / e.target.clientHeight;
    },
    onImageLoaded(e) {
      this.viewBox = `0 0 ${e.target.naturalWidth} ${e.target.naturalHeight}`;
    },
    onMouseEvent(type, e) {
      const width = this.src ? e.target.naturalWidth : this.size ? this.size[0] : 1;
      const height = this.src ? e.target.naturalHeight : this.size ? this.size[1] : 1;
      this.$emit("mouse", {
        mouse_event_type: type,
        image_x: (e.offsetX * width) / e.target.clientWidth,
        image_y: (e.offsetY * height) / e.target.clientHeight,
        button: e.button,
        buttons: e.buttons,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
      });
    },
  },
  computed: {
    onCrossEvents() {
      if (!this.cross) return {};
      return {
        mouseenter: () => (this.showCross = true),
        mouseleave: () => (this.showCross = false),
        mousemove: (event) => this.updateCrossHair(event),
      };
    },
    onUserEvents() {
      const events = {};
      for (const type of this.events) {
        events[type] = (event) => this.onMouseEvent(type, event);
      }
      return events;
    },
  },
  props: {
    src: String,
    content: String,
    size: Object,
    events: Array,
    cross: Boolean,
    t: String,
  },
};
