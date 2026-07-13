import { render, screen } from "@testing-library/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";

describe("Table components", () => {
  it("renders Table component", () => {
    render(
      <Table data-testid="table">
        <tbody>
          <tr>
            <td>Cell</td>
          </tr>
        </tbody>
      </Table>,
    );
    const table = screen.getByTestId("table");
    expect(table).toHaveAttribute("data-slot", "table");
  });

  it("renders Table with custom className", () => {
    render(
      <Table className="custom-table" data-testid="table">
        <tbody>
          <tr>
            <td>Cell</td>
          </tr>
        </tbody>
      </Table>,
    );
    const table = screen.getByTestId("table");
    expect(table).toHaveClass("custom-table");
  });

  it("renders TableHeader", () => {
    render(
      <table>
        <TableHeader data-testid="header">
          <tr>
            <th>Header</th>
          </tr>
        </TableHeader>
      </table>,
    );
    const header = screen.getByTestId("header");
    expect(header).toHaveAttribute("data-slot", "table-header");
  });

  it("renders TableBody", () => {
    render(
      <table>
        <TableBody data-testid="body">
          <tr>
            <td>Body</td>
          </tr>
        </TableBody>
      </table>,
    );
    const body = screen.getByTestId("body");
    expect(body).toHaveAttribute("data-slot", "table-body");
  });

  it("renders TableFooter", () => {
    render(
      <table>
        <TableFooter data-testid="footer">
          <tr>
            <td>Footer</td>
          </tr>
        </TableFooter>
      </table>,
    );
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveAttribute("data-slot", "table-footer");
  });

  it("renders TableRow", () => {
    render(
      <table>
        <tbody>
          <TableRow data-testid="row">
            <td>Row</td>
          </TableRow>
        </tbody>
      </table>,
    );
    const row = screen.getByTestId("row");
    expect(row).toHaveAttribute("data-slot", "table-row");
  });

  it("renders TableRow with custom className", () => {
    render(
      <table>
        <tbody>
          <TableRow className="custom-row" data-testid="row">
            <td>Row</td>
          </TableRow>
        </tbody>
      </table>,
    );
    const row = screen.getByTestId("row");
    expect(row).toHaveClass("custom-row");
  });

  it("renders TableHead", () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHead data-testid="head">Column</TableHead>
          </tr>
        </thead>
      </table>,
    );
    const head = screen.getByTestId("head");
    expect(head).toHaveAttribute("data-slot", "table-head");
  });

  it("renders TableCell", () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell data-testid="cell">Data</TableCell>
          </tr>
        </tbody>
      </table>,
    );
    const cell = screen.getByTestId("cell");
    expect(cell).toHaveAttribute("data-slot", "table-cell");
  });

  it("renders TableCell with custom className", () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell className="custom-cell" data-testid="cell">
              Data
            </TableCell>
          </tr>
        </tbody>
      </table>,
    );
    const cell = screen.getByTestId("cell");
    expect(cell).toHaveClass("custom-cell");
  });

  it("renders TableCaption", () => {
    render(
      <table>
        <TableCaption data-testid="caption">Table caption</TableCaption>
        <tbody>
          <tr>
            <td>Data</td>
          </tr>
        </tbody>
      </table>,
    );
    const caption = screen.getByTestId("caption");
    expect(caption).toHaveAttribute("data-slot", "table-caption");
  });

  it("renders complete table structure", () => {
    render(
      <Table data-testid="complete-table">
        <TableCaption>Sales</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
            <TableCell>100</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>100</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    expect(screen.getByTestId("complete-table")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });
});
