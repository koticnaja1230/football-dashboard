import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="state-box error">
          <p>💥 React Error: {this.state.error}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text3)" }}>
            ดู Console (F12) เพื่อดูรายละเอียด
          </p>
          <button
            className="retry-btn"
            onClick={() => this.setState({ error: null })}
          >
            ลองใหม่
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
