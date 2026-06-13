use crate::error::AppResult;
use rusqlite::{params, Connection};
use std::collections::{HashMap, HashSet};

pub fn unlocked_ids(conn: &Connection) -> AppResult<HashSet<String>> {
    let mut stmt = conn.prepare("SELECT node_id FROM unlock_nodes")?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
    let mut set = HashSet::new();
    for row in rows {
        set.insert(row?);
    }
    Ok(set)
}

/// node_id → unlocked_at
pub fn unlocked_at_map(conn: &Connection) -> AppResult<HashMap<String, String>> {
    let mut stmt = conn.prepare("SELECT node_id, unlocked_at FROM unlock_nodes")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    let mut map = HashMap::new();
    for row in rows {
        let (id, at) = row?;
        map.insert(id, at);
    }
    Ok(map)
}

pub fn insert(conn: &Connection, node_id: &str, unlocked_at: &str) -> AppResult<()> {
    conn.execute(
        "INSERT INTO unlock_nodes (node_id, unlocked_at) VALUES (?1, ?2)",
        params![node_id, unlocked_at],
    )?;
    Ok(())
}
