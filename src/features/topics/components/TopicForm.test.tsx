import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicForm } from "./TopicForm";

describe("TopicForm", () => {
  it("submits the selected values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TopicForm submitLabel="Guardar tema" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nombre del tema"), "Geografía");
    await user.click(screen.getByRole("button", { name: /naranja impulso/i }));
    await user.click(screen.getByRole("button", { name: /historia/i }));
    await user.click(screen.getByRole("button", { name: /guardar tema/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Geografía",
      color: "#f97316",
      icon: "landmark",
    });
  });
});
