export interface ModelAdapter<T, S> {
  fromDto(dto: T): S;
  toDto(model: S): T;
}

export interface UserDto {
  id: number;
  name: string;
  // Other user properties
}

export interface PostDto {
  id: number;
  title: string;
  content: string;
  // Other post properties
}

export interface TodoDto {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

export interface TodoVm {
  userId: number;
  id: number;
  text: string;
  completed: boolean;
}
