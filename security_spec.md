# Security Specification: Gestão de Infrequência Escolar - E.M. Ricardo Misson

## 1. Data Invariants
1. Only authenticated staff/teachers (`request.auth != null`) can read and write school data.
2. Turma documents must have a valid `nome` string between 1 and 100 characters.
3. Aluno documents must reference a valid non-empty `turmaId` and have a valid `nome` string between 1 and 150 characters. All other personal fields (matricula, responsavelNome, telefone, etc.) are strictly bounded in length and type.
4. Falta documents must have non-empty `alunoId`, `turmaId`, a valid `data` string (length <= 20), and `horasFalta` as a positive number.
5. Atestado documents must have non-empty `alunoId`, `turmaId`, and valid `dataInicio` / `dataTermino` dates.
6. Intervencao documents must have non-empty `alunoId`, `turmaId`, `data`, and `tipo`.
7. ID path variables must satisfy `isValidId(id)` (`id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
8. All string fields must have strict `.size() <= MAX` bounds to prevent Denial-of-Wallet resource exhaustion.

## 2. The "Dirty Dozen" Threat Payloads (Must be blocked)
1. **Unauthenticated Read/Write**: Unauthenticated access to `/turmas`, `/alunos`, `/faltas`, `/atestados`, `/intervencoes`.
2. **Missing Turma Name**: Creating a turma with `{ "turno": "Matutino" }` omitting `nome`.
3. **Huge Turma Name Buffer Overflow**: Injecting 50,000 characters into `nome`.
4. **Missing Aluno Name**: Registering a student with empty or missing `nome`.
5. **Path Traversal / ID Poisoning**: Creating documents with keys like `../secrets` or symbols violating `^[a-zA-Z0-9_\\-]+$`.
6. **Negative or Non-numeric HorasFalta**: Injecting `{ horasFalta: -10 }` or `{ horasFalta: "cem" }`.
7. **Missing Falta Date**: Submitting a falta record without `data`.
8. **Missing Atestado Period**: Creating an atestado without `dataInicio` or `dataTermino`.
9. **Corrupt Intervencao**: Omitting required `tipo` in an intervention record.
10. **Huge PII Injection**: Storing 1MB text into `responsavelTelefone` or `observacoes`.
11. **Shadow System Overwrite**: Injecting arbitrary unvalidated arbitrary schemas or functions.
12. **Malformed Types**: Passing boolean values where string types are expected.

## 3. Security Rules Matrix
- `/turmas/{turmaId}`: Authenticated read & write if schema valid and `isValidId(turmaId)`.
- `/alunos/{alunoId}`: Authenticated read & write if schema valid and `isValidId(alunoId)`.
- `/faltas/{faltaId}`: Authenticated read & write if schema valid and `isValidId(faltaId)`.
- `/atestados/{atestadoId}`: Authenticated read & write if schema valid and `isValidId(atestadoId)`.
- `/intervencoes/{intervencaoId}`: Authenticated read & write if schema valid and `isValidId(intervencaoId)`.
