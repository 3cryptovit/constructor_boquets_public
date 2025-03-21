import { render, fireEvent, screen } from "@testing-library/react";
import Register from "../components/Register";

test("Рендер формы регистрации", () => {
  render(<Register />);
  expect(screen.getByPlaceholderText("Имя")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Пароль")).toBeInTheDocument();
});

test("Ввод данных в форму", () => {
  render(<Register />);
  fireEvent.change(screen.getByPlaceholderText("Имя"), { target: { value: "testuser" } });
  fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "password123" } });
  expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
  expect(screen.getByDisplayValue("password123")).toBeInTheDocument();
});
