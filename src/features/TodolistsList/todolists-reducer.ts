import {todolistsAPI, TodolistType} from "../../api/todolists-api"
import {Dispatch} from "redux"
import {initializeAppTC, RequestStatusType, setAppStatusAC} from "../../app/app-reducer"
import {handleServerNetworkError} from "../../utils/error-utils"
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState: Array<TodolistDomainType> = []

const slice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        removeTodolistAC(state, action: PayloadAction<{ id: string }>) {
            // 1 способ:
            // return state.filter(tl => tl.id != action.id)

            // 2 способ:
            // смотри примеры ---> immer.js update patterns
            // найдем индекс элемента что надо удалить
            const index = state.findIndex(tl => tl.id === action.payload.id)
            if (index) {
                // по найденному индексу удалим 1 элем.
                state.splice(index, 1)
            }
        },
        addTodolistAC(state, action: PayloadAction<{ todolist: TodolistType }>) {
            // return [{...action.todolist, filter: "all", entityStatus: "idle"}, ...state]
            // добавим вначало тудулист:
            state.unshift({...action.payload.todolist, filter: "all", entityStatus: "idle"})
        },
        changeTodolistTitleAC(state, action: PayloadAction<{ id: string, title: string }>) {
            // return state.map(tl => tl.id === action.id ? {...tl, title: action.title} : tl)
            // находим нужный тудулсит его индекс:
            let index = state.findIndex(tl => tl.id === action.payload.id)
            // по индексу достанем нужный тудулист и меняем ему тайтл на тот что сидит в экшене:
            // из массива достали объект state[index] === todolist что нашди -- по его индексу -- и меняем ему тайтл
            state[index].title = action.payload.title
        },
        changeTodolistFilterAC(state, action: PayloadAction<{ id: string, filter: FilterValuesType }>) {
            let index = state.findIndex(tl => tl.id === action.payload.id)
            state[index].filter = action.payload.filter
        },
        changeTodolistEntityStatusAC(state, action: PayloadAction<{ id: string, status: RequestStatusType }>) {
            let index = state.findIndex(tl => tl.id === action.payload.id)
            // присваиваем entityStatus-су - то что пришло в параметрах
            state[index].entityStatus = action.payload.status
        },
        setTodolistsAC(state, action: PayloadAction<{ todolists: Array<TodolistType> }>) {
            // return action.todolists.map(tl => ({...tl, filter: "all", entityStatus: "idle"}))
            return action.payload.todolists.map(tl => ({...tl, filter: "all", entityStatus: "idle"}))
        },
    },
})

export const todolistsReducer = slice.reducer
export const {
    removeTodolistAC,
    addTodolistAC,
    changeTodolistTitleAC,
    changeTodolistFilterAC,
    changeTodolistEntityStatusAC,
    setTodolistsAC,
} = slice.actions
/*
в этом месте удобно ставить debugger -- и можно.....
 */
// debugger

// thunks
export const fetchTodolistsTC = () => {
    return (dispatch: ThunkDispatch) => {
        dispatch(setAppStatusAC({status: "loading"}))
        todolistsAPI.getTodolists()
            .then((res) => {
                dispatch(setTodolistsAC({todolists: res.data}))
                dispatch(setAppStatusAC({status: "succeeded"}))
            })
            .catch(error => {
                handleServerNetworkError(error, dispatch);
            })
    }
}
export const removeTodolistTC = (todolistId: string) => {
    return (dispatch: ThunkDispatch) => {
        //изменим глобальный статус приложения, чтобы вверху полоса побежала
        dispatch(setAppStatusAC({status: "loading"}))
        //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
        dispatch(changeTodolistEntityStatusAC({id: todolistId, status: "loading"}))
        todolistsAPI.deleteTodolist(todolistId)
            .then((res) => {
                dispatch(removeTodolistAC({id: todolistId}))
                //скажем глобально приложению, что асинхронная операция завершена
                dispatch(setAppStatusAC({status: "succeeded"}))
            })
    }
}
export const addTodolistTC = (title: string) => {
    return (dispatch: ThunkDispatch) => {
        dispatch(setAppStatusAC({status: "loading"}))
        todolistsAPI.createTodolist(title)
            .then((res) => {
                dispatch(addTodolistAC({todolist: res.data.data.item}))
                dispatch(setAppStatusAC({status: "succeeded"}))
            })
    }
}
export const changeTodolistTitleTC = (id: string, title: string) => {
    return (dispatch: Dispatch) => {
        todolistsAPI.updateTodolist(id, title)
            .then((res) => {
                // теперь принмает 1 параметр = объект
                dispatch(changeTodolistTitleAC({id: id, title: title}))
            })
    }
}

// types
export type AddTodolistActionType = ReturnType<typeof addTodolistAC>;
export type RemoveTodolistActionType = ReturnType<typeof removeTodolistAC>;
export type SetTodolistsActionType = ReturnType<typeof setTodolistsAC>;

export type FilterValuesType = "all" | "active" | "completed";
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}
type ThunkDispatch = Dispatch

/*
- помним что когда создаем тудулист еще должны добавить массив для тасок
-
 */
