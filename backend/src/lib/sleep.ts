import { resolve } from "path"



export  default function sleep(ms : number){
    return new Promise(resolve => setTimeout(resolve, ms))
}
