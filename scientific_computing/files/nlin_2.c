#include <petsc.h>

typedef struct 
{
	double b;
} AppCtx;


PetscErrorCode Funct(SNES snes, Vec x, Vec F, void *ctx)
{
	AppCtx *user = (AppCtx*)ctx;
	const double b = user->b, *ax; 
	double *aF;
	
	VecGetArrayRead(x, &ax);
	VecGetArray(F, &aF);
	aF[0] = (1.0/b)*PetscExpReal(b*ax[0]) - ax[1];
	aF[1] = ax[0]*ax[0] + ax[1]*ax[1] - 1.0;
	VecRestoreArrayRead(x, &ax);
	VecRestoreArray(F, &aF);
	
	return 0;
}

PetscErrorCode JacFunct(SNES snes,Vec x,Mat J,Mat P,void *ctx)
{
	AppCtx *user = (AppCtx*)ctx;
	const double b = user->b, *ax;
	double v[4];
	int row[2] = {0, 1}, col[2] = {0, 1};
	
	VecGetArrayRead(x, &ax);
	v[0] = PetscExpReal(b*ax[0]); 
	v[1] = -1.0;
	v[2] = 2*ax[0];
	v[3] = 2*ax[1];
	
	MatSetValues(P, 2, row, 2, col, v, INSERT_VALUES);
	VecRestoreArrayRead(x, &ax);
	
	MatAssemblyBegin(P, MAT_FINAL_ASSEMBLY);
	MatAssemblyEnd(P, MAT_FINAL_ASSEMBLY);
	
	if (J != P)
	{
		MatAssemblyBegin(J, MAT_FINAL_ASSEMBLY);
		MatAssemblyEnd(J, MAT_FINAL_ASSEMBLY);
	}
	
	return 0;
	
}


int main(int argc, char **argv)
{
	SNES snes; 
	Vec x, r;
	Mat J;
	AppCtx user;
	PetscInitialize(&argc, &argv, NULL, "Solve a nonlinear equation");
	
	user.b = 2.0;
	
	// Create the arrays x and r and populate with 1.0
	VecCreate(PETSC_COMM_WORLD, &x);
	VecSetSizes(x, PETSC_DECIDE, 2);
	VecSetFromOptions(x);
	VecSet(x, 1.0);
	VecDuplicate(x, &r);
	
	MatCreate(PETSC_COMM_WORLD, &J);
	MatSetSizes(J, PETSC_DECIDE, PETSC_DECIDE, 2, 2);
	MatSetFromOptions(J);
	MatSetUp(J);
	
	// Create the SNES object
	SNESCreate(PETSC_COMM_WORLD, &snes);
	SNESSetFunction(snes, r, Funct, &user);
	SNESSetJacobian(snes, J, J, JacFunct, &user);
	SNESSetFromOptions(snes);
	SNESSolve(snes, NULL, x);
	
	VecView(x, PETSC_VIEWER_STDOUT_WORLD);
	
	VecDestroy(&x); VecDestroy(&r); SNESDestroy(&snes);
	MatDestroy(&J);
	
	return PetscFinalize();
}