import { render, screen, fireEvent } from "@testing-library/react";
import { ResultCard } from "@/components/features/results/ResultCard";
import type { RetrievalResult } from "@/types/search.types";

const mockResult: RetrievalResult = {
  resumeId: "c1",
  name: "Jane Doe",
  role: "Senior Engineer",
  score: 0.92,
  totalExperience: 5,
  skills: ["Python", "ML"],
  summary: "Experienced Python developer…",
};

describe("ResultCard", () => {
  it("renders candidate name and score", () => {
    render(
      <ResultCard
        result={mockResult}
        rank={1}
        searchType="vector"
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("0.92")).toBeInTheDocument();
  });

  it("calls onSelect with resumeId on click", () => {
    const onSelect = jest.fn();
    render(
      <ResultCard
        result={mockResult}
        rank={1}
        searchType="vector"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("c1");
  });
});
