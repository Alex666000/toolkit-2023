import {
    addTodolistAC,
    AddTodolistActionType, removeTodolistAC,
    RemoveTodolistActionType, setTodolistsAC,
    SetTodolistsActionType
} from "./todolists-reducer"
import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from "../../api/todolists-api"
import {Dispatch} from "redux"
import {AppRootStateType} from "../../app/store"
import {setAppStatusAC} from "../../app/app-reducer"
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils"
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState: TasksStateType = {}

const slice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        removeTaskAC(state, action: PayloadAction<{ taskId: string, todolistId: string }>) {
            // return {...state, [action.todolistId]: state[action.todolistId].filter(t => t.id != action.taskId)}

            const tasks = state[action.payload.todolistId]
            // найденая таска
            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            // удаляем из тасок одну найденую таску
            if (index > -1) {
                // удаляет кусок массива начиная с такого индекса - столько то элементов:
                tasks.splice(index, 1)
            }
        },
        addTaskAC(state, action: PayloadAction<{ task: TaskType }>) {
            // return {...state, [action.task.todoListId]: [action.task, ...state[action.task.todoListId]]}
//берем нужный массив state[action.payload.task.todolistId]
            // и в начало добавляем таску что в экшене к нам и приходит
            state[action.payload.task.todoListId].unshift(action.payload.task)
        },
        updateTaskAC(state, action: PayloadAction<{ taskId: string, model: UpdateDomainTaskModelType, todolistId: string }>) {
            // return {
            //     ...state,
            //     [action.todolistId]: state[action.todolistId]
            //         .map(t => t.id === action.taskId ? {...t, ...action.model} : t)
            // }

            const tasks = state[action.payload.todolistId]
            // нашли индекс таски которую надо обновить
            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            if (index > -1) {
                // берем конкретную таску по индексу и переприсваиваем ей объект который будет состоять из той же таски что и состояло но --->
                // ---> переопределим дополнительно еще......action.payload.model ---> где сидят те части таски которые надо обновить
                tasks[index] = {...tasks[index], ...action.payload.model}
            }

        },
        setTasksAC(state, action: PayloadAction<{ tasks: Array<TaskType>, todolistId: string }>) {
            // return {...state, [action.todolistId]: action.tasks}
            state[action.payload.todolistId] = action.payload.tasks

        },
    },
    // на основе extraReducers не создаются АС-ры..как на основе обычных reducers: {} - то что и нужно для обработки
    // не типичных случаев...
    // обрабатывает чужие АС
    extraReducers: (builder) => {
        builder.addCase(addTodolistAC, (state, action) => {
            // return {...state, [action.todolist.id]: []}
            state[action.payload.todolist.id] = []
        });
        builder.addCase(removeTodolistAC, (state, action) => {
            /*
            const copyState = {...state}
            delete copyState[action.id]
            return copyState
            */

            delete state[action.payload.id]
        });
        builder.addCase(setTodolistsAC, (state, action) => {
            /*
            const copyState = {...state}
            action.todolists.forEach(tl => {
                copyState[tl.id] = []
            })
            return copyState
            */

            action.payload.todolists.forEach(tl => state[tl.id] = [])
        })

    }
    /* {
         // чужой экшн:
         [addTodolistAC.type]: (state, action: PayloadAction<{}>) => {

         },
         // чужой экшн:
         [removeTodolistAC.type]: (state, action: PayloadAction<{}>) => {

         },
         // чужой экшн:
         [setTodolistsAC.type]: (state, action: PayloadAction<{}>) => {

         },
     }*/
})

export const tasksReducer = slice.reducer
export const {removeTaskAC, addTaskAC, updateTaskAC, setTasksAC} = slice.actions

// thunks
export const fetchTasksTC = (todolistId: string) => (dispatch: Dispatch) => {
    dispatch(setAppStatusAC({status: "loading"}))
    todolistsAPI.getTasks(todolistId)
        .then((res) => {
            const tasks = res.data.items
            dispatch(setTasksAC({tasks, todolistId}))
            dispatch(setAppStatusAC({status: "succeeded"}))
        })
}
export const removeTaskTC = (taskId: string, todolistId: string) => (dispatch: Dispatch) => {
    todolistsAPI.deleteTask(todolistId, taskId)
        .then(res => {
            const action = removeTaskAC({taskId, todolistId})
            dispatch(action)
        })
}
export const addTaskTC = (title: string, todolistId: string) => (dispatch: Dispatch) => {
    dispatch(setAppStatusAC({status: "loading"}))
    todolistsAPI.createTask(todolistId, title)
        .then(res => {
            if (res.data.resultCode === 0) {
                const task = res.data.data.item
                const action = addTaskAC({task})
                dispatch(action)
                dispatch(setAppStatusAC({status: "succeeded"}))
            } else {
                handleServerAppError(res.data, dispatch);
            }
        })
        .catch((error) => {
            handleServerNetworkError(error, dispatch)
        })
}
export const updateTaskTC = (taskId: string, model: UpdateDomainTaskModelType, todolistId: string) =>
    (dispatch: Dispatch, getState: () => AppRootStateType) => {
        const state = getState()
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn("task not found in the state")
            return
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...model
        }

        todolistsAPI.updateTask(todolistId, taskId, apiModel)
            .then(res => {
                if (res.data.resultCode === 0) {
                    // const action = updateTaskAC( {taskId: taskId, model: domainModel, todolistId: todolistId} )
                    // переименуем domainModel на model и т к свойсва совпадают со значениемукоратим запись:
                    const action = updateTaskAC( {taskId, model: model, todolistId: todolistId} )
                    dispatch(action)
                } else {
                    handleServerAppError(res.data, dispatch);
                }
            })
            .catch((error) => {
                handleServerNetworkError(error, dispatch);
            })
    }

// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}

/*
- помним что когда создаем тудулист еще должны добавить массив для тасок
- рефакторим исходя из этого редюсер мин 1.30.00
- tasksReducer обраьатывает не только свои АС - чужие типы экшенов делаем в экстраред.... см. todolistst-reducer.ts
- свои редюсеры оставляем как были старым способом - обычным созданием reducers: {}

----------------> Работа с объектами:<----------------------------------------------------------------------------------
Было:
 ---- const action = updateTaskAC( taskId, domainModel, todolistId)
 Стало:
---- const action = updateTaskAC( {taskId: taskId, model: domainModel, todolistId: todolistId} )
Или можем переименовать domainModel в model (если переменная model в этом файле не использовалась..) и тогда сократить:
---  const action = updateTaskAC( {taskId, model, todolistId} )

 ----------------------КАК РАБОТАТЬ С ОБЪЕКТОМ:
- dispatch(setAppStatusAC({status: "loading"})) --- значает что передаем объект (1 параметр = объекту вместо нескольких параметров) с таким-то значением --->  setAppStatusAC(state, action: PayloadAction<{ status: RequestStatusType }>) {
            state.status = action.payload.status
        },
так рефакторим по всему приложению -- АС то есть теперь всегда принимают объект где они описываются
------------------------------------------------------------------------------------------------------------------------
-
 */
