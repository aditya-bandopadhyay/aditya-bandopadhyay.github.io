#include <petsc.h>

int main(int argc, char **argv)
{
	PetscErrorCode ierr;
	int rank, i;
	double eapp, localfact;
	
	PetscInitialize(&argc, &argv, NULL, "Approximation for e\n"); 
	ierr = MPI_Comm_rank(PETSC_COMM_WORLD, &rank); CHKERRQ(ierr);
	
	localfact = 1.0;
	for (i = 2; i<rank + 1; i++)
	{
		localfact = localfact/i;
	}	
	
	PetscPrintf(PETSC_COMM_SELF, "%d \t %lf\n", rank, localfact);
	
	ierr = MPI_Allreduce(&localfact, &eapp, 1, MPI_DOUBLE, MPI_SUM, PETSC_COMM_WORLD); CHKERRQ(ierr);
	
	PetscPrintf(PETSC_COMM_WORLD, "e approx is %3.14lf\n", eapp);
	PetscPrintf(PETSC_COMM_WORLD, "e exact is %3.14lf\n", exp(1));
	
	return PetscFinalize();
}