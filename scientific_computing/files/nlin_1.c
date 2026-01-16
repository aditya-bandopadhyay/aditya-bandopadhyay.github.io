#include <petsc.h>

PetscErrorCode Funct(SNES snes, Vec x, Vec F, void *ctx)
{
	const double b = 2.0, *ax;
	double *aF;
	
	VecGetArrayRead(x, &ax);
	VecGetArray(F, &aF);
	aF[0] = (1.0/b)*PetscExpReal(b*ax[0]) - ax[1];
	aF[1] = ax[0]*ax[0] + ax[1]*ax[1] - 1.0;
	VecRestoreArrayRead(x, &ax);
	VecRestoreArray(F, &aF);
	
	return 0;
}

int main(int argc, char **argv)
{
	SNES snes; 
	Vec x, r;
	
	PetscInitialize(&argc, &argv, NULL, "Solve a nonlinear equation");
	
	// Create the arrays x and r and populate with 1.0
	VecCreate(PETSC_COMM_WORLD, &x);
	VecSetSizes(x, PETSC_DECIDE, 2);
	VecSetFromOptions(x);
	VecSet(x, 1.0);
	VecDuplicate(x, &r);
	
	SNESCreate(PETSC_COMM_WORLD, &snes);
	SNESSetFunction(snes, r, Funct, NULL);
	SNESSetFromOptions(snes);
	SNESSolve(snes, NULL, x);
	
	VecView(x, PETSC_VIEWER_STDOUT_WORLD);
	
	VecDestroy(&x); VecDestroy(&r); SNESDestroy(&snes);
	
	
	return PetscFinalize();
}