include ${PETSC_DIR}/lib/petsc/conf/variables
include ${PETSC_DIR}/lib/petsc/conf/rules

expo_petsc: expo_petsc.o  chkopts
	-${CLINKER} -o expo_petsc expo_petsc.o  ${PETSC_LIB}
	${RM} expo_petsc.o

decl_vector: decl_vector.o  chkopts
	-${CLINKER} -o decl_vector decl_vector.o  ${PETSC_LIB}
	${RM} decl_vector.o

sol_sim_system: sol_sim_system.o  chkopts
	-${CLINKER} -o sol_sim_system sol_sim_system.o  ${PETSC_LIB}
	${RM} sol_sim_system.o
	
tridiag: tridiag.o  chkopts
	-${CLINKER} -o tridiag tridiag.o  ${PETSC_LIB}
	${RM} tridiag.o
	
poisson: poisson.o  chkopts
	-${CLINKER} -o poisson poisson.o  ${PETSC_LIB}
	${RM} poisson.o
	
nlin_1: nlin_1.o  chkopts
	-${CLINKER} -o nlin_1 nlin_1.o  ${PETSC_LIB}
	${RM} nlin_1.o
	
nlin_2: nlin_2.o  chkopts
	-${CLINKER} -o nlin_2 nlin_2.o  ${PETSC_LIB}
	${RM} nlin_2.o	

rxndfn: rxndfn.o  chkopts
	-${CLINKER} -o rxndfn rxndfn.o  ${PETSC_LIB}
	${RM} rxndfn.o	
	
ode_ts: ode_ts.o  chkopts
	-${CLINKER} -o ode_ts ode_ts.o  ${PETSC_LIB}
	${RM} ode_ts.o	
	
heat2d: heat2d.o  chkopts
	-${CLINKER} -o heat2d heat2d.o  ${PETSC_LIB}
	${RM} heat2d.o	
	
turing: turing.o  chkopts
	-${CLINKER} -o turing turing.o  ${PETSC_LIB}
	${RM} turing.o	