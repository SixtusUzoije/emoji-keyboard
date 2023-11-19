import "./content-script.css";
import { Logger } from "../utils/logger";
import { WinboxRenderer } from "./winbox-renderer";
import manifest from "../manifest.json";
import { Floatie } from "../standalone/floatie";
import "./set-up-emojis";

// Listen for ":" keydown
// Show a floaty with suggestions based on last three keywords (minus articles)
// If nothing has been typed yet, show continue type for emoji suggestions.
// As the user types, filter the suggestions, prioritizing their keyword matches
class ContentScript {
  logger = new Logger(this);
  winboxRenderer = new WinboxRenderer();
  floatie = new Floatie();
  isFloatieActive = false;
  query = "";

  init() {
    if (this.inApplicationIframe()) {
    } else if (this.inAnyIframe()) {
    } else {
      // Add event listeners for main window.
      window.addEventListener("message", this.onMessageHandler, false);
      document.onkeydown = this.winboxRenderer.onEscHandler;
      document.onscroll = this.winboxRenderer.onEscHandler;
      document.onresize = this.winboxRenderer.onEscHandler;

      // Unlike keydown, keypress is not raised by noncharacter keys.
      window.addEventListener("keypress", this.floatie.keyListenerForEmoji);
      window.addEventListener("keydown", this.floatie.metaListenerForEmoji);

      this.floatie.renderer = (msg) => this.winboxRenderer.handleMessage(msg);
    }
  }

  onMessageHandler = (event) => {
    if (event.origin !== window.location.origin) {
      this.logger.debug(
        "Ignoring message from different origin",
        event.origin,
        event.data
      );
      return;
    }

    if (event.data.application !== manifest.__package_name) {
      this.logger.debug(
        "Ignoring origin messsage not initiated by emoji-keyboard"
      );
      return;
    }

    this.winboxRenderer.handleMessage(event.data);
  };

  /*
   * Returns true if this script is running inside an iframe,
   * since the content script is added to all frames.
   */
  inAnyIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  inApplicationIframe() {
    try {
      return window.name === manifest.__package_name + "/mainframe";
    } catch (e) {
      return false;
    }
  }
}
new ContentScript().init();
