import { TodoDto, TodoVm } from '../../interfaces/interfaces';

export function toTodoVm(todo: TodoDto): TodoVm {
  return {
    id: todo?.id,
    userId: todo?.userId,
    completed: todo?.completed,
    text: todo?.title,
  };
}

export function toTodoDto(todo: TodoVm): TodoDto {
  return {
    id: todo?.id,
    userId: todo?.userId,
    completed: todo?.completed,
    title: todo?.text,
  };
}
