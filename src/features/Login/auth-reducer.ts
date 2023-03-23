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
        setIsLoggedInAC(state, action: PayloadAction<{value: boolean}>) {
            state.isLoggedIn = action.payload.value
        }
    }
})

export const authReducer = slice.reducer
export const {setIsLoggedInAC} = slice.actions

// thunks
export const loginTC = (data: LoginParamsType) => (dispatch: Dispatch) => {
    dispatch(setAppStatusAC("loading"))
    authAPI.login(data)
        .then(res => {
            if (res.data.resultCode === 0) {
                dispatch(setIsLoggedInAC({value: true}))
                dispatch(setAppStatusAC("succeeded"))
            } else {
                handleServerAppError(res.data, dispatch)
            }
        })
        .catch((error) => {
            handleServerNetworkError(error, dispatch)
        })
}
export const logoutTC = () => (dispatch: Dispatch) => {
    dispatch(setAppStatusAC("loading"))
    authAPI.logout()
        .then(res => {
            if (res.data.resultCode === 0) {
                dispatch(setIsLoggedInAC({value: false}))
                dispatch(setAppStatusAC("succeeded"))
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
-

 */