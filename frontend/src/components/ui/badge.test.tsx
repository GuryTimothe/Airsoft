import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders badge with default variant", () => {
    render(<Badge>Status</Badge>);
    const badge = screen.getByText("Status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-variant", "default");
  });

  it("renders badge with secondary variant", () => {
    render(<Badge variant="secondary">Info</Badge>);
    const badge = screen.getByText("Info");
    expect(badge).toHaveAttribute("data-variant", "secondary");
  });

  it("renders badge with destructive variant", () => {
    render(<Badge variant="destructive">Error</Badge>);
    const badge = screen.getByText("Error");
    expect(badge).toHaveAttribute("data-variant", "destructive");
  });

  it("renders badge with outline variant", () => {
    render(<Badge variant="outline">Alert</Badge>);
    const badge = screen.getByText("Alert");
    expect(badge).toHaveAttribute("data-variant", "outline");
  });

  it("renders badge with ghost variant", () => {
    render(<Badge variant="ghost">Ghost</Badge>);
    const badge = screen.getByText("Ghost");
    expect(badge).toHaveAttribute("data-variant", "ghost");
  });

  it("renders badge with link variant", () => {
    render(<Badge variant="link">Link</Badge>);
    const badge = screen.getByText("Link");
    expect(badge).toHaveAttribute("data-variant", "link");
  });

  it("renders badge with custom className", () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge).toHaveClass("custom-class");
  });

  it("renders badge with data attributes", () => {
    render(<Badge data-testid="test-badge">Test</Badge>);
    const badge = screen.getByTestId("test-badge");
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("renders badge with asChild prop", () => {
    render(
      <Badge asChild>
        <button type="button">Link Badge</button>
      </Badge>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("renders badge with multiple children", () => {
    render(
      <Badge>
        <span>Icon</span>
        <span>Text</span>
      </Badge>,
    );
    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
});
