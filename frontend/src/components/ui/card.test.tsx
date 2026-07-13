import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./card";

describe("Card components", () => {
  it("renders Card with default size", () => {
    render(<Card data-testid="card">Card content</Card>);
    const card = screen.getByTestId("card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveAttribute("data-size", "default");
  });

  it("renders Card with sm size", () => {
    render(
      <Card size="sm" data-testid="card">
        Small card
      </Card>,
    );
    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-size", "sm");
  });

  it("renders Card with custom className", () => {
    render(
      <Card className="custom-class" data-testid="card">
        Content
      </Card>,
    );
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("custom-class");
  });

  it("renders CardHeader", () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    const header = screen.getByTestId("header");
    expect(header).toHaveAttribute("data-slot", "card-header");
  });

  it("renders CardTitle", () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    const title = screen.getByTestId("title");
    expect(title).toHaveAttribute("data-slot", "card-title");
  });

  it("renders CardDescription", () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>);
    const desc = screen.getByTestId("desc");
    expect(desc).toHaveAttribute("data-slot", "card-description");
  });

  it("renders CardAction", () => {
    render(<CardAction data-testid="action">Action</CardAction>);
    const action = screen.getByTestId("action");
    expect(action).toHaveAttribute("data-slot", "card-action");
  });

  it("renders CardContent", () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    const content = screen.getByTestId("content");
    expect(content).toHaveAttribute("data-slot", "card-content");
  });

  it("renders CardFooter", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveAttribute("data-slot", "card-footer");
  });

  it("renders complete card structure", () => {
    render(
      <Card data-testid="complete-card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>,
    );
    expect(screen.getByTestId("complete-card")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("renders card with action in header", () => {
    render(
      <Card data-testid="card-with-action">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardAction>Action button</CardAction>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByText("Action button")).toBeInTheDocument();
  });

  it("renders CardHeader with custom className", () => {
    render(
      <CardHeader className="custom-header" data-testid="header">
        Header
      </CardHeader>,
    );
    const header = screen.getByTestId("header");
    expect(header).toHaveClass("custom-header");
  });
});
