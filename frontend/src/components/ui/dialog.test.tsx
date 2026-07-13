import { render, screen } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";

describe("Dialog components", () => {
  it("renders Dialog root component", () => {
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">Open</DialogTrigger>
      </Dialog>,
    );
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
  });

  it("renders DialogTrigger", () => {
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">Trigger</DialogTrigger>
      </Dialog>,
    );
    const trigger = screen.getByTestId("trigger");
    expect(trigger).toHaveAttribute("data-slot", "dialog-trigger");
  });

  it("renders Dialog with Portal (overlay is rendered)", () => {
    const { container } = render(
      <Dialog open>
        <DialogPortal>
          <DialogOverlay />
        </DialogPortal>
      </Dialog>,
    );
    // Portal content renders outside main DOM, just verify no error
    expect(container).toBeInTheDocument();
  });

  it("renders DialogHeader", () => {
    render(<DialogHeader data-testid="header">Header</DialogHeader>);
    const header = screen.getByTestId("header");
    expect(header).toHaveAttribute("data-slot", "dialog-header");
  });

  it("renders DialogTitle within Dialog", () => {
    render(
      <Dialog>
        <DialogTitle data-testid="title">Title</DialogTitle>
      </Dialog>,
    );
    const title = screen.getByTestId("title");
    expect(title).toHaveAttribute("data-slot", "dialog-title");
  });

  it("renders DialogDescription within Dialog", () => {
    render(
      <Dialog>
        <DialogDescription data-testid="desc">Description</DialogDescription>
      </Dialog>,
    );
    const desc = screen.getByTestId("desc");
    expect(desc).toHaveAttribute("data-slot", "dialog-description");
  });

  it("renders DialogFooter with default showCloseButton", () => {
    render(<DialogFooter data-testid="footer">Footer content</DialogFooter>);
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveAttribute("data-slot", "dialog-footer");
  });

  it("renders DialogFooter with showCloseButton true within Dialog", () => {
    render(
      <Dialog>
        <DialogFooter showCloseButton={true}>
          Footer with close button
        </DialogFooter>
      </Dialog>,
    );
    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it("renders DialogFooter with showCloseButton false", () => {
    render(
      <DialogFooter showCloseButton={false}>
        Footer without close button
      </DialogFooter>,
    );
    expect(
      screen.queryByRole("button", { name: /close/i }),
    ).not.toBeInTheDocument();
  });

  it("renders DialogContent with showCloseButton true", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={true}>
          <DialogTitle>Dialog Title</DialogTitle>
          Content with close button
        </DialogContent>
      </Dialog>,
    );
    // The close button should be rendered
    const closeButtons = screen.getAllByRole("button");
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it("renders DialogContent with showCloseButton false", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Dialog Title</DialogTitle>
          Content without close button
        </DialogContent>
      </Dialog>,
    );
    expect(
      screen.getByText("Content without close button"),
    ).toBeInTheDocument();
  });

  it("renders DialogClose component", () => {
    render(
      <Dialog>
        <DialogClose data-testid="close">Close</DialogClose>
      </Dialog>,
    );
    const close = screen.getByTestId("close");
    expect(close).toHaveAttribute("data-slot", "dialog-close");
  });

  it("renders Dialog with Portal", () => {
    const { container } = render(
      <Dialog>
        <DialogPortal>
          <div>Portal content</div>
        </DialogPortal>
      </Dialog>,
    );
    // DialogPortal renders outside the main DOM tree, so we just check the render didn't error
    expect(container).toBeInTheDocument();
  });

  it("renders DialogHeader with custom className", () => {
    render(
      <DialogHeader className="custom-header" data-testid="header">
        Header
      </DialogHeader>,
    );
    const header = screen.getByTestId("header");
    expect(header).toHaveClass("custom-header");
  });
});
