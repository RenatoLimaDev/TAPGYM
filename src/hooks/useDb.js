import { useState, useCallback } from 'react'
import { dbLoad, dbSave } from '../utils/db.js'

export function useDb() {
  const [db, setDb] = useState(dbLoad)

  const save = useCallback(newDb => {
    setDb(newDb)
    dbSave(newDb)
  }, [])

  return { db, save }
}
