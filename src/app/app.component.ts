import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { API_FUNCTIONS } from './services/functional-http/functional-generic.http';
import { TodoVm } from './interfaces/interfaces';
import { HttpContext } from '@angular/common/http';
import { INTERCEPTOR_CONFIG } from './services/dexie-storage/storage-http.context';
import { switchMap, take, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  fetchFunctions = inject(API_FUNCTIONS);

  fetchTodos = this.fetchFunctions.todos.GET(
    {
      context: new HttpContext().set(INTERCEPTOR_CONFIG,
        {
          collectionKey: 'todos',
          shouldStore: true,
          shouldReturnStoredValuesOnError: true,
          cacheBuster: false
        })
    }
  );

  todos = signal<TodoVm[]>([]);
  sortedTodos = computed(() => this.todos().sort((a, b) => a.id - b.id));

  todoFetch = this.fetchTodos.pipe(take(1), takeUntilDestroyed()).subscribe(todos => {
    this.todos.set(todos);
  });

  changeTodo(todo: TodoVm) {
    this.fetchFunctions.todos.PUT(todo.id, {...todo, completed: !todo.completed}, {context: new HttpContext().set(INTERCEPTOR_CONFIG, {
      collectionKey: 'todos',
      shouldStore: true,
      cacheBuster: false
    })}).pipe(take(1)).subscribe((updatedtodo) => {
      this.todos.set(this.todos().map(todo => todo.id === updatedtodo.id ? updatedtodo : todo))
    });
  }
}
