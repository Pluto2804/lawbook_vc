import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreateRoom from "./components/CreateRoom";
import Room from "./components/Room";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CreateRoom />} />
          <Route path="/room/:room_id" element={<Room />} />
        </Routes>
      </Layout>
    </Router>
  );
}

