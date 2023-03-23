import {Dispatch} from "redux"
import {setAppStatusAC} from "../../app/app-reducer"
import {authAPI, LoginParamsType} from "../../api/todolists-api"
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils"
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState = {
    isLoggedIn: false
}

const slice = createSlice({
    name: "auth",
    initialState: initialState,
    // каждый кейс это отдельный маленький подъредюсер
    reducers: {
        // это не АС-ры - это мини редюсеры но внутри слайса создадуться АС-ры
        setIsLoggedInAC(state, action: PayloadAction<{ value: boolean }>) {
            state.isLoggedIn = action.payload.value
        }
    }
})

export const authReducer = slice.reducer
export const {setIsLoggedInAC} = slice.actions

// thunks
export const loginTC = (data: LoginParamsType) => (dispatch: Dispatch) => {
    dispatch(setAppStatusAC({status: "loading"}))
    authAPI.login(data)
        .then(res => {
            if (res.data.resultCode === 0) {
                dispatch(setIsLoggedInAC({value: true}))
                dispatch(setAppStatusAC({status: "succeeded"}))
            } else {
                handleServerAppError(res.data, dispatch)
            }
        })
        .catch((error) => {
            handleServerNetworkError(error, dispatch)
        })
}
export const logoutTC = () => (dispatch: Dispatch) => {
    dispatch(setAppStatusAC({status: "loading"}))
    authAPI.logout()
        .then(res => {
            if (res.data.resultCode === 0) {
                dispatch(setIsLoggedInAC({value: false}))
                dispatch(setAppStatusAC({status: "succeeded"}))
            } else {
                handleServerAppError(res.data, dispatch)
            }
        })
        .catch((error) => {
            handleServerNetworkError(error, dispatch)
        })
}

/*
              ------------- Рефакторим из реадкс --- в тулкит:
-в тулките не надо писать константы и АС-ры...кол сократиться, удалим типизацию экненов и инишлстейта, удаляем строгую типизацию в санках
- все данные засовывать в пейлоад тулкит говорит state.isLoggedIn = action.payload.value
- но чтобы тут был пейлоад мы должны где диспатчим засунуть в объект:  {value: false}
- раз указали тут такую типизацию setIsLoggedInAC(state, action: PayloadAction) мы теперь дисптчить должны внутрь АС - объект {value: false}
      ----------------------КАК РАБОТАТЬ С ОБЪЕКТОМ:
- dispatch(setAppStatusAC({status: "loading"})) --- значает что передаем объект (1 параметр = объекту вместо нескольких параметров) с таким-то значением --->  setAppStatusAC(state, action: PayloadAction<{ status: RequestStatusType }>) {
            state.status = action.payload.status
        },
так рефакторим по всему приложению -- АС то есть теперь всегда принимают объект где они описываются

- Но если свойство одно то можно payload не делать! Но ради практики сделаем...
- immer.js update patterns - ищи раздел чтобы мутабельно сделать код в редюсере -- там примеры смотри
- помним что когда создаем тудулист еще должны добавить массив для тасок
- рефакторим исходя из этого редюсер мин 1.30.00
-
 */