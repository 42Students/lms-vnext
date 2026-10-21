import Head from "next/head";
import Quizpanel from "@/components/Quiz/quizpanel";
import { Component } from "react";
import { useRouter } from "next/router";
import { reportReactBoundaryError } from "@/utils/clientErrorReporting";

// Simple inline error boundary for quiz page
class QuizErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, errorInfo) {
    reportReactBoundaryError(error, errorInfo);
  }

  handleRetry = () => this.setState({ hasError: false });

  handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main>
          <section className="bg-gray s-fix-100vh ln-quiz-page-section">
            <div className="h-100 ln-quiz-page-inner d-flex align-items-center justify-content-center">
              <div className="text-center">
                <h2>Something went wrong</h2>
                <p>Failed to load the quiz. Your answers are not being submitted from this error screen.</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: "1rem" }}>
                  <button
                    onClick={this.handleRetry}
                    style={{ padding: "8px 16px", cursor: "pointer", borderRadius: "4px", border: "1px solid #ccc", background: "#f5f5f5" }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={this.handleReload}
                    style={{ padding: "8px 16px", cursor: "pointer", borderRadius: "4px", border: "1px solid #ccc", background: "#f5f5f5" }}
                  >
                    Refresh page
                  </button>
                  <button
                    onClick={this.props.onBack}
                    style={{ padding: "8px 16px", cursor: "pointer", borderRadius: "4px", border: "1px solid #ccc", background: "#f5f5f5" }}
                  >
                    Back to quizzes
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default function StudentQuiz() {
  const router = useRouter();
  const resetKey = [
    router.query?.quizId ?? "",
    router.query?.review ?? "",
    router.query?.embed ?? "",
    router.asPath ?? "",
  ].join(":");

  return (
    <QuizErrorBoundary resetKey={resetKey} onBack={() => router.push("/learn/allQuizzes")}>
      <StudentQuizContent />
    </QuizErrorBoundary>
  );
}

function StudentQuizContent() {
  return (
    <>
      <Head>
        <title>{"42Learn <-> Quiz"}</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <section className="bg-gray s-fix-100vh ln-quiz-page-section">
          <div className="h-100 ln-quiz-page-inner">
            <Quizpanel />
          </div>
        </section>
      </main>
    </>
  );
}

StudentQuiz.nolayout = true;
