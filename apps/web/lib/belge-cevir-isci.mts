// Dönüştürme işçisi: ana sunucu sürecinden ayrı iş parçacığında koşar (belge-cevir-surec.ts).
import { parentPort, workerData } from "node:worker_threads";
import { dosyadanMetin } from "./belge-cevir.ts";

parentPort!.postMessage(await dosyadanMetin(workerData.ad, workerData.veri));
